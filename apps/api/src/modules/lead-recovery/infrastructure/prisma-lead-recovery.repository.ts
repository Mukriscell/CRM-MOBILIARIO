import { Injectable } from "@nestjs/common";
import type { LeadRecovery } from "@prisma/client";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import {
  CreateRecoveryInput,
  ILeadRecoveryRepository,
} from "../domain/lead-recovery.repository.interface";
import type { InactivityThresholdKey, RecoveryCandidate, RecoveryStats } from "../domain/lead-recovery.entity";

const COLD_THRESHOLD_DAYS = 30;

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function resolveThreshold(daysInactive: number): InactivityThresholdKey {
  if (daysInactive >= 90) return "DAYS_90";
  if (daysInactive >= 60) return "DAYS_60";
  return "DAYS_30";
}

function toCandidate(lead: {
  id: string;
  tenantId: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  source: string;
  status: string;
  currentScoreTier: string | null;
  lastActivityAt: Date;
}): RecoveryCandidate {
  const daysInactive = Math.floor((Date.now() - lead.lastActivityAt.getTime()) / 86_400_000);
  return {
    leadId: lead.id,
    tenantId: lead.tenantId,
    firstName: lead.firstName,
    lastName: lead.lastName,
    phone: lead.phone,
    source: lead.source,
    status: lead.status,
    currentScoreTier: lead.currentScoreTier,
    lastActivityAt: lead.lastActivityAt,
    inactivityDays: daysInactive,
    threshold: resolveThreshold(daysInactive),
  };
}

@Injectable()
export class PrismaLeadRecoveryRepository implements ILeadRecoveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCandidates(tenantId: string): Promise<RecoveryCandidate[]> {
    const cutoff = daysAgo(COLD_THRESHOLD_DAYS);

    const [leads, pendingRecoveries] = await Promise.all([
      this.prisma.lead.findMany({
        where: {
          tenantId,
          status: { notIn: ["PERDIDO"] },
          lastActivityAt: { lt: cutoff },
          deletedAt: null,
        },
        select: {
          id: true,
          tenantId: true,
          firstName: true,
          lastName: true,
          phone: true,
          source: true,
          status: true,
          currentScoreTier: true,
          lastActivityAt: true,
        },
        orderBy: { lastActivityAt: "asc" },
      }),
      this.prisma.leadRecovery.findMany({
        where: { tenantId, outcome: "PENDING" },
        select: { leadId: true },
      }),
    ]);

    const pendingSet = new Set(pendingRecoveries.map((r) => r.leadId));

    return leads
      .filter((l) => !pendingSet.has(l.id))
      .map(toCandidate);
  }

  async findCandidateById(tenantId: string, leadId: string): Promise<RecoveryCandidate | null> {
    const cutoff = daysAgo(COLD_THRESHOLD_DAYS);

    const lead = await this.prisma.lead.findFirst({
      where: {
        id: leadId,
        tenantId,
        status: { notIn: ["PERDIDO"] },
        lastActivityAt: { lt: cutoff },
        deletedAt: null,
      },
      select: {
        id: true,
        tenantId: true,
        firstName: true,
        lastName: true,
        phone: true,
        source: true,
        status: true,
        currentScoreTier: true,
        lastActivityAt: true,
      },
    });

    return lead ? toCandidate(lead) : null;
  }

  create(input: CreateRecoveryInput): Promise<LeadRecovery> {
    return this.prisma.leadRecovery.create({
      data: {
        tenantId: input.tenantId,
        leadId: input.leadId,
        inactivityThreshold: input.inactivityThreshold,
        outcome: input.outcome,
        recoveryAction: (input.recoveryAction as object) ?? undefined,
        resolvedAt: input.outcome !== "PENDING" ? new Date() : undefined,
      },
    });
  }

  findById(id: string): Promise<LeadRecovery | null> {
    return this.prisma.leadRecovery.findUnique({ where: { id } });
  }

  findByLead(tenantId: string, leadId: string): Promise<LeadRecovery[]> {
    return this.prisma.leadRecovery.findMany({
      where: { tenantId, leadId },
      orderBy: { detectedAt: "desc" },
    });
  }

  async updateLeadStatus(tenantId: string, leadId: string, status: "PERDIDO" | "CONTACTADO"): Promise<void> {
    await this.prisma.lead.updateMany({
      where: { id: leadId, tenantId },
      data: { status, lastActivityAt: new Date() },
    });
  }

  async stats(tenantId: string): Promise<RecoveryStats> {
    const [candidates, records] = await Promise.all([
      this.findCandidates(tenantId),
      this.prisma.leadRecovery.findMany({
        where: { tenantId },
        select: { outcome: true },
      }),
    ]);

    return {
      candidates: candidates.length,
      pending: records.filter((r) => r.outcome === "PENDING").length,
      reactivated: records.filter((r) => r.outcome === "REACTIVATED").length,
      lost: records.filter((r) => r.outcome === "LOST").length,
      noResponse: records.filter((r) => r.outcome === "NO_RESPONSE").length,
    };
  }
}

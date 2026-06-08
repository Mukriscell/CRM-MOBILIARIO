import { Injectable } from "@nestjs/common";
import { LeadFollowUp } from "@prisma/client";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import {
  CreateFollowUpInput,
  IFollowUpRepository,
} from "../domain/follow-up.repository.interface";
import { FollowUpStats } from "../domain/follow-up.entity";

@Injectable()
export class PrismaFollowUpRepository implements IFollowUpRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(inputs: CreateFollowUpInput[]): Promise<LeadFollowUp[]> {
    await this.prisma.leadFollowUp.createMany({ data: inputs });
    return this.prisma.leadFollowUp.findMany({
      where: { leadId: inputs[0].leadId, tenantId: inputs[0].tenantId },
      orderBy: { sequenceStep: "asc" },
    });
  }

  findById(tenantId: string, id: string): Promise<LeadFollowUp | null> {
    return this.prisma.leadFollowUp.findFirst({ where: { id, tenantId } });
  }

  findByLead(tenantId: string, leadId: string): Promise<LeadFollowUp[]> {
    return this.prisma.leadFollowUp.findMany({
      where: { tenantId, leadId },
      orderBy: { sequenceStep: "asc" },
    });
  }

  findPendingForTenant(tenantId: string): Promise<LeadFollowUp[]> {
    return this.prisma.leadFollowUp.findMany({
      where: { tenantId, status: "PENDING" },
      orderBy: { scheduledAt: "asc" },
    });
  }

  findAllForTenant(tenantId: string, status?: string): Promise<LeadFollowUp[]> {
    return this.prisma.leadFollowUp.findMany({
      where: { tenantId, ...(status ? { status: status as "PENDING" | "SENT" | "CANCELLED" | "FAILED" } : {}) },
      orderBy: { scheduledAt: "desc" },
    });
  }

  async cancelAllPendingForLead(tenantId: string, leadId: string, reason: string): Promise<number> {
    const result = await this.prisma.leadFollowUp.updateMany({
      where: { tenantId, leadId, status: "PENDING" },
      data: { status: "CANCELLED", cancelReason: reason },
    });
    return result.count;
  }

  async markExecuted(tenantId: string, id: string): Promise<LeadFollowUp> {
    await this.prisma.leadFollowUp.updateMany({
      where: { id, tenantId },
      data: { status: "SENT", executedAt: new Date() },
    });
    return this.prisma.leadFollowUp.findFirst({ where: { id, tenantId } }) as Promise<LeadFollowUp>;
  }

  async markFailed(tenantId: string, id: string, reason: string): Promise<LeadFollowUp> {
    await this.prisma.leadFollowUp.updateMany({
      where: { id, tenantId },
      data: { status: "FAILED", cancelReason: reason },
    });
    return this.prisma.leadFollowUp.findFirst({ where: { id, tenantId } }) as Promise<LeadFollowUp>;
  }

  async markCancelled(tenantId: string, id: string, reason: string): Promise<void> {
    await this.prisma.leadFollowUp.updateMany({
      where: { id, tenantId },
      data: { status: "CANCELLED", cancelReason: reason },
    });
  }

  async stats(tenantId: string): Promise<FollowUpStats> {
    const now = new Date();
    const all = await this.prisma.leadFollowUp.findMany({
      where: { tenantId },
      select: { status: true, scheduledAt: true },
    });

    const pending = all.filter((f) => f.status === "PENDING" && f.scheduledAt > now).length;
    const overdue = all.filter((f) => f.status === "PENDING" && f.scheduledAt <= now).length;
    const executed = all.filter((f) => f.status === "SENT").length;
    const denominator = executed + overdue;
    const compliancePct = denominator > 0 ? Math.round((executed / denominator) * 100) : 100;

    return { pending, overdue, executed, compliancePct };
  }
}

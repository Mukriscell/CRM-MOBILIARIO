import { Injectable } from "@nestjs/common";
import { Lead, Prisma } from "@prisma/client";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import {
  CreateLeadData,
  ILeadRepository,
  LeadListFilters,
  LeadListResult,
  LeadStats,
} from "../domain/lead.repository.interface";
import { decodeCursor, encodeCursor } from "./cursor";

@Injectable()
export class PrismaLeadRepository implements ILeadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateLeadData): Promise<Lead> {
    try {
      return await this.prisma.lead.create({
        data: {
          tenantId: data.tenantId,
          firstName: data.firstName ?? null,
          lastName: data.lastName ?? null,
          email: data.email ?? null,
          phone: data.phone ?? null,
          source: data.source,
          budgetAmount: data.budgetAmount ?? null,
          budgetCurrency: data.budgetCurrency ?? "CLP",
          interestedPropertyId: data.interestedPropertyId ?? null,
          rawPayload: (data.rawPayload as Prisma.InputJsonValue) ?? undefined,
          lastActivityAt: new Date(),
        },
      });
    } catch (e: any) {
      // P2002: unique constraint violation — otra request ganó la race condition.
      // Devolvemos el lead existente en vez de fallar con un 500.
      if (e?.code === "P2002") {
        const existing = await this.findActiveByContact(data.tenantId, data.phone ?? null, data.email ?? null);
        if (existing) return existing;
      }
      throw e;
    }
  }

  findActiveByContact(tenantId: string, phone?: string | null, email?: string | null): Promise<Lead | null> {
    const or: Prisma.LeadWhereInput[] = [];
    if (phone) or.push({ phone });
    if (email) or.push({ email });
    if (or.length === 0) return Promise.resolve(null);
    return this.prisma.lead.findFirst({
      where: { tenantId, deletedAt: null, status: { not: "PERDIDO" }, OR: or },
      orderBy: { createdAt: "desc" },
    });
  }

  findById(tenantId: string, id: string): Promise<Lead | null> {
    return this.prisma.lead.findFirst({ where: { id, tenantId, deletedAt: null } });
  }

  async listByCursor(
    tenantId: string,
    filters: LeadListFilters,
    cursor: string | null,
    limit: number,
  ): Promise<LeadListResult> {
    const where: Prisma.LeadWhereInput = { tenantId, deletedAt: null };
    if (filters.status) where.status = filters.status as any;
    if (filters.source) where.source = filters.source as any;
    if (filters.assignedUserId) where.assignedUserId = filters.assignedUserId;
    if (filters.unresponded) where.firstResponseAt = null;

    const decoded = decodeCursor(cursor);
    if (decoded) {
      // Orden por createdAt desc, id desc → keyset pagination estable
      where.OR = [
        { createdAt: { lt: new Date(decoded.createdAt) } },
        { createdAt: new Date(decoded.createdAt), id: { lt: decoded.id } },
      ];
    }

    const rows = await this.prisma.lead.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];
    const nextCursor =
      hasMore && last ? encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id }) : null;

    return { items, nextCursor, hasMore };
  }

  async touchActivity(tenantId: string, leadId: string, occurredAt: Date): Promise<void> {
    await this.prisma.lead.updateMany({
      where: { id: leadId, tenantId },
      data: { lastActivityAt: occurredAt },
    });
  }

  async stats(tenantId: string): Promise<LeadStats> {
    const base = { tenantId, deletedAt: null };
    const [total, responded, respondedLeads, hot, warm, cold] = await Promise.all([
      this.prisma.lead.count({ where: base }),
      this.prisma.lead.count({ where: { ...base, firstResponseAt: { not: null } } }),
      this.prisma.lead.findMany({
        where: { ...base, firstResponseAt: { not: null } },
        select: { createdAt: true, firstResponseAt: true },
      }),
      this.prisma.lead.count({ where: { ...base, currentScoreTier: "HOT" } }),
      this.prisma.lead.count({ where: { ...base, currentScoreTier: "WARM" } }),
      this.prisma.lead.count({ where: { ...base, currentScoreTier: "COLD" } }),
    ]);

    let avgTtfrSeconds: number | null = null;
    if (respondedLeads.length > 0) {
      const totalSeconds = respondedLeads.reduce((acc, l) => {
        return acc + (l.firstResponseAt!.getTime() - l.createdAt.getTime()) / 1000;
      }, 0);
      avgTtfrSeconds = Math.round(totalSeconds / respondedLeads.length);
    }

    return { total, responded, unresponded: total - responded, avgTtfrSeconds, hot, warm, cold };
  }

  async markFirstResponse(tenantId: string, leadId: string, at: Date): Promise<Lead | null> {
    // Solo fija firstResponseAt si está NULL (idempotente: la primera respuesta gana)
    const updated = await this.prisma.lead.updateMany({
      where: { id: leadId, tenantId, firstResponseAt: null },
      data: { firstResponseAt: at, lastActivityAt: at },
    });
    if (updated.count === 0) return null;
    return this.prisma.lead.findFirst({ where: { id: leadId, tenantId } });
  }

  async softDelete(tenantId: string, id: string): Promise<void> {
    const result = await this.prisma.lead.updateMany({
      where: { id, tenantId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) throw new Error("Lead no encontrado");
  }

  async assign(
    tenantId: string,
    leadId: string,
    userId: string,
    by: "SYSTEM" | "MANUAL",
    reason?: unknown,
  ): Promise<Lead> {
    return this.prisma.$transaction(async (tx) => {
      // Verificación de tenant antes de mutar (barrera de aislamiento)
      const existing = await tx.lead.findFirst({ where: { id: leadId, tenantId, deletedAt: null } });
      if (!existing) {
        throw new Error("Lead no encontrado en el tenant");
      }
      await tx.leadAssignment.create({
        data: { tenantId, leadId, userId, assignedBy: by, reason: (reason as Prisma.InputJsonValue) ?? undefined },
      });
      return tx.lead.update({ where: { id: leadId }, data: { assignedUserId: userId } });
    });
  }
}

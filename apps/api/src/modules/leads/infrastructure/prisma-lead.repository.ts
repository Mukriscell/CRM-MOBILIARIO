import { Injectable } from "@nestjs/common";
import { Lead, Prisma } from "@prisma/client";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import {
  CreateLeadData,
  ILeadRepository,
  LeadListFilters,
  LeadListResult,
} from "../domain/lead.repository.interface";
import { decodeCursor, encodeCursor } from "./cursor";

@Injectable()
export class PrismaLeadRepository implements ILeadRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateLeadData): Promise<Lead> {
    return this.prisma.lead.create({
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

import { Injectable } from "@nestjs/common";
import type { Prisma, VisitStatus } from "@prisma/client";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { NotFoundError } from "../../../shared/errors/domain-error";
import {
  CreateReminderInput,
  IVisitRepository,
  ReminderView,
} from "../domain/visit.repository.interface";
import { ScheduleVisitInput, VisitListFilters, VisitView } from "../domain/visit.entity";

type VisitWithRelations = Prisma.VisitGetPayload<{
  include: {
    lead: { select: { firstName: true; lastName: true; phone: true } };
    property: { select: { internalCode: true; address: true } };
    user: { select: { firstName: true; lastName: true } };
  };
}>;

const RELATIONS = {
  lead: { select: { firstName: true, lastName: true, phone: true } },
  property: { select: { internalCode: true, address: true } },
  user: { select: { firstName: true, lastName: true } },
} as const;

function fullName(first?: string | null, last?: string | null): string | null {
  const name = [first, last].filter(Boolean).join(" ");
  return name || null;
}

function toView(v: VisitWithRelations): VisitView {
  return {
    id: v.id,
    tenantId: v.tenantId,
    leadId: v.leadId,
    propertyId: v.propertyId,
    userId: v.userId,
    scheduledAt: v.scheduledAt,
    status: v.status,
    notes: v.notes,
    createdAt: v.createdAt,
    leadName: fullName(v.lead?.firstName, v.lead?.lastName),
    leadPhone: v.lead?.phone ?? null,
    propertyCode: v.property?.internalCode ?? null,
    propertyAddress: v.property?.address ?? null,
    userName: fullName(v.user?.firstName, v.user?.lastName),
  };
}

@Injectable()
export class PrismaVisitRepository implements IVisitRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, filters: VisitListFilters = {}): Promise<VisitView[]> {
    const where: Prisma.VisitWhereInput = { tenantId };
    if (filters.status) where.status = filters.status as VisitStatus;
    if (filters.userId) where.userId = filters.userId;
    if (filters.from || filters.to) {
      where.scheduledAt = {};
      if (filters.from) where.scheduledAt.gte = filters.from;
      if (filters.to) where.scheduledAt.lte = filters.to;
    }

    const rows = await this.prisma.visit.findMany({
      where,
      include: RELATIONS,
      orderBy: { scheduledAt: "asc" },
    });
    return rows.map(toView);
  }

  async findById(tenantId: string, id: string): Promise<VisitView | null> {
    const row = await this.prisma.visit.findFirst({ where: { id, tenantId }, include: RELATIONS });
    return row ? toView(row) : null;
  }

  async create(tenantId: string, input: ScheduleVisitInput): Promise<VisitView> {
    const visit = await this.prisma.$transaction(async (tx) => {
      const created = await tx.visit.create({
        data: {
          tenantId,
          leadId: input.leadId,
          propertyId: input.propertyId,
          userId: input.userId,
          scheduledAt: input.scheduledAt,
          status: "SCHEDULED",
          notes: input.notes ?? null,
        },
        include: RELATIONS,
      });

      await tx.leadTimelineEvent.create({
        data: {
          tenantId,
          leadId: input.leadId,
          eventType: "VISIT_SCHEDULED",
          actorId: input.userId,
          payload: {
            visitId: created.id,
            propertyId: input.propertyId,
            scheduledAt: input.scheduledAt.toISOString(),
          },
        },
      });

      return created;
    });

    return toView(visit);
  }

  async updateStatus(tenantId: string, id: string, status: VisitStatus): Promise<VisitView> {
    // Aísla por tenant antes de mutar.
    const existing = await this.prisma.visit.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundError(`Visita ${id} no encontrada`);

    const updated = await this.prisma.visit.update({
      where: { id },
      data: { status },
      include: RELATIONS,
    });
    return toView(updated);
  }

  async createReminders(tenantId: string, inputs: CreateReminderInput[]): Promise<ReminderView[]> {
    const created = await this.prisma.$transaction(
      inputs.map((i) =>
        this.prisma.visitReminder.create({
          data: { tenantId, visitId: i.visitId, sendAt: i.sendAt, status: "PENDING" },
        }),
      ),
    );
    return created.map((r) => ({
      id: r.id,
      tenantId: r.tenantId,
      visitId: r.visitId,
      sendAt: r.sendAt,
      status: r.status,
    }));
  }

  async findReminderById(tenantId: string, reminderId: string): Promise<ReminderView | null> {
    const r = await this.prisma.visitReminder.findFirst({ where: { id: reminderId, tenantId } });
    return r
      ? { id: r.id, tenantId: r.tenantId, visitId: r.visitId, sendAt: r.sendAt, status: r.status }
      : null;
  }

  async markReminder(tenantId: string, reminderId: string, status: "SENT" | "FAILED"): Promise<void> {
    await this.prisma.visitReminder.updateMany({
      where: { id: reminderId, tenantId },
      data: { status, sentAt: status === "SENT" ? new Date() : undefined },
    });
  }

  async cancelPendingReminders(tenantId: string, visitId: string): Promise<string[]> {
    const pending = await this.prisma.visitReminder.findMany({
      where: { tenantId, visitId, status: "PENDING" },
      select: { id: true },
    });
    if (pending.length === 0) return [];
    await this.prisma.visitReminder.updateMany({
      where: { tenantId, visitId, status: "PENDING" },
      data: { status: "FAILED" },
    });
    return pending.map((r) => r.id);
  }
}

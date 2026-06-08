import { Injectable } from "@nestjs/common";
import { Conversation, Message, Prisma } from "@prisma/client";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import {
  AppendMessageData,
  ConversationPage,
  ConversationWithLast,
  IConversationRepository,
  MessagePage,
} from "../domain/conversation.repository.interface";

@Injectable()
export class PrismaConversationRepository implements IConversationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateByPhone(
    tenantId: string,
    phone: string,
    leadId?: string | null,
    assignedUserId?: string | null,
  ): Promise<Conversation> {
    const existing = await this.prisma.conversation.findFirst({
      where: { tenantId, waContactPhone: phone, status: { not: "CLOSED" } },
      orderBy: { createdAt: "desc" },
    });
    if (existing) {
      // Completar lead/asignado si llegaron después de crear la conversación
      if ((leadId && !existing.leadId) || (assignedUserId && !existing.assignedUserId)) {
        return this.prisma.conversation.update({
          where: { id: existing.id },
          data: {
            leadId: existing.leadId ?? leadId ?? null,
            assignedUserId: existing.assignedUserId ?? assignedUserId ?? null,
          },
        });
      }
      return existing;
    }

    try {
      return await this.prisma.conversation.create({
        data: {
          tenantId,
          waContactPhone: phone,
          leadId: leadId ?? null,
          assignedUserId: assignedUserId ?? null,
          status: "OPEN",
        },
      });
    } catch (e: any) {
      // P2002: otra request creó la conversación en la race condition window.
      if (e?.code === "P2002") {
        const race = await this.prisma.conversation.findFirst({
          where: { tenantId, waContactPhone: phone, status: { not: "CLOSED" } },
          orderBy: { createdAt: "desc" },
        });
        if (race) return race;
      }
      throw e;
    }
  }

  findById(tenantId: string, id: string): Promise<Conversation | null> {
    return this.prisma.conversation.findFirst({ where: { id, tenantId } });
  }

  findByLeadId(tenantId: string, leadId: string): Promise<Conversation | null> {
    return this.prisma.conversation.findFirst({
      where: { tenantId, leadId, status: { not: "CLOSED" } },
      orderBy: { createdAt: "desc" },
    });
  }

  appendMessage(data: AppendMessageData): Promise<Message> {
    return this.prisma.message.create({
      data: {
        tenantId: data.tenantId,
        conversationId: data.conversationId,
        direction: data.direction,
        type: data.type ?? "TEXT",
        body: data.body ?? null,
        waMessageId: data.waMessageId ?? null,
        sentByUserId: data.sentByUserId ?? null,
        metadata: (data.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    });
  }

  async listMessages(tenantId: string, conversationId: string, cursor: string | null, limit: number): Promise<MessagePage> {
    const rows = await this.prisma.message.findMany({
      where: { tenantId, conversationId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: limit + 1,
    });
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;
    return { items, nextCursor, hasMore };
  }

  async listConversations(tenantId: string, cursor: string | null, limit: number): Promise<ConversationPage> {
    const rows = await this.prisma.conversation.findMany({
      where: { tenantId },
      orderBy: [{ lastMessageAt: { sort: "desc", nulls: "last" } }, { id: "desc" }],
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      take: limit + 1,
      include: {
        lead: { select: { firstName: true, lastName: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;
    const data: ConversationWithLast[] = items.map((c) => {
      const last = c.messages[0];
      const leadName = c.lead
        ? [c.lead.firstName, c.lead.lastName].filter(Boolean).join(" ") || null
        : null;
      return { ...c, lastMessageBody: last?.body ?? null, lastMessageDirection: last?.direction ?? null, leadName };
    });
    return { items: data, nextCursor, hasMore };
  }

  async touchLastMessage(
    tenantId: string,
    conversationId: string,
    at: Date,
    windowExpiresAt: Date,
  ): Promise<void> {
    await this.prisma.conversation.updateMany({
      where: { id: conversationId, tenantId },
      data: { lastMessageAt: at, windowExpiresAt },
    });
  }
}

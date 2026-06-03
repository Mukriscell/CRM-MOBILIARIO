import { Injectable } from "@nestjs/common";
import { Conversation, Message, Prisma } from "@prisma/client";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import {
  AppendMessageData,
  ConversationWithLast,
  IConversationRepository,
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
    return this.prisma.conversation.create({
      data: {
        tenantId,
        waContactPhone: phone,
        leadId: leadId ?? null,
        assignedUserId: assignedUserId ?? null,
        status: "OPEN",
      },
    });
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

  listMessages(tenantId: string, conversationId: string): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: { tenantId, conversationId },
      orderBy: { createdAt: "asc" },
    });
  }

  async listConversations(tenantId: string): Promise<ConversationWithLast[]> {
    const rows = await this.prisma.conversation.findMany({
      where: { tenantId },
      orderBy: { lastMessageAt: { sort: "desc", nulls: "last" } },
      include: {
        lead: { select: { firstName: true, lastName: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    return rows.map((c) => {
      const last = c.messages[0];
      const leadName = c.lead
        ? [c.lead.firstName, c.lead.lastName].filter(Boolean).join(" ") || null
        : null;
      return {
        ...c,
        lastMessageBody: last?.body ?? null,
        lastMessageDirection: last?.direction ?? null,
        leadName,
      };
    });
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

import { Conversation, Message, MessageDirection, MessageType } from "@prisma/client";

export const CONVERSATION_REPOSITORY = Symbol("CONVERSATION_REPOSITORY");

export interface AppendMessageData {
  tenantId: string;
  conversationId: string;
  direction: MessageDirection;
  type?: MessageType;
  body?: string | null;
  waMessageId?: string | null;
  sentByUserId?: string | null; // NULL = automático/sistema
  metadata?: unknown;
}

export interface ConversationWithLast extends Conversation {
  lastMessageBody: string | null;
  lastMessageDirection: MessageDirection | null;
  leadName: string | null;
}

export interface IConversationRepository {
  /** Busca por teléfono o crea una conversación nueva (idempotente por tenant+phone abierto). */
  findOrCreateByPhone(
    tenantId: string,
    phone: string,
    leadId?: string | null,
    assignedUserId?: string | null,
  ): Promise<Conversation>;
  findById(tenantId: string, id: string): Promise<Conversation | null>;
  findByLeadId(tenantId: string, leadId: string): Promise<Conversation | null>;
  appendMessage(data: AppendMessageData): Promise<Message>;
  listMessages(tenantId: string, conversationId: string): Promise<Message[]>;
  listConversations(tenantId: string): Promise<ConversationWithLast[]>;
  touchLastMessage(tenantId: string, conversationId: string, at: Date, windowExpiresAt: Date): Promise<void>;
}

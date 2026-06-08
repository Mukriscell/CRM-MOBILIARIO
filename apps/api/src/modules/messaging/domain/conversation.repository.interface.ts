import { Conversation, Message, MessageDirection, MessageType } from "@prisma/client";

export const CONVERSATION_REPOSITORY = Symbol("CONVERSATION_REPOSITORY");

export interface AppendMessageData {
  tenantId: string;
  conversationId: string;
  direction: MessageDirection;
  type?: MessageType;
  body?: string | null;
  waMessageId?: string | null;
  sentByUserId?: string | null;
  metadata?: unknown;
}

export interface ConversationWithLast extends Conversation {
  lastMessageBody: string | null;
  lastMessageDirection: MessageDirection | null;
  leadName: string | null;
}

export interface ConversationPage {
  items: ConversationWithLast[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface MessagePage {
  items: Message[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface IConversationRepository {
  findOrCreateByPhone(
    tenantId: string,
    phone: string,
    leadId?: string | null,
    assignedUserId?: string | null,
  ): Promise<Conversation>;
  findById(tenantId: string, id: string): Promise<Conversation | null>;
  findByLeadId(tenantId: string, leadId: string): Promise<Conversation | null>;
  appendMessage(data: AppendMessageData): Promise<Message>;
  listMessages(tenantId: string, conversationId: string, cursor: string | null, limit: number): Promise<MessagePage>;
  listConversations(tenantId: string, cursor: string | null, limit: number): Promise<ConversationPage>;
  touchLastMessage(tenantId: string, conversationId: string, at: Date, windowExpiresAt: Date): Promise<void>;
}

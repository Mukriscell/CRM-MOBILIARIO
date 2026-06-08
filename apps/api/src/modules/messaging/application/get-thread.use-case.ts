import { Inject, Injectable } from "@nestjs/common";
import { Conversation } from "@prisma/client";
import {
  CONVERSATION_REPOSITORY,
  IConversationRepository,
  MessagePage,
} from "../domain/conversation.repository.interface";
import { NotFoundError } from "../../../shared/errors/domain-error";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export interface ThreadResult {
  conversation: Conversation;
  messages: MessagePage;
}

@Injectable()
export class GetThreadUseCase {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: IConversationRepository,
  ) {}

  async execute(tenantId: string, conversationId: string, cursor: string | null = null, limit = DEFAULT_LIMIT): Promise<ThreadResult> {
    const conversation = await this.conversations.findById(tenantId, conversationId);
    if (!conversation) throw new NotFoundError("Conversación no encontrada");
    const safeLimit = Math.min(Math.max(1, limit), MAX_LIMIT);
    const messages = await this.conversations.listMessages(tenantId, conversationId, cursor, safeLimit);
    return { conversation, messages };
  }
}

import { Inject, Injectable } from "@nestjs/common";
import { Conversation, Message } from "@prisma/client";
import {
  CONVERSATION_REPOSITORY,
  IConversationRepository,
} from "../domain/conversation.repository.interface";
import { NotFoundError } from "../../../shared/errors/domain-error";

export interface ThreadResult {
  conversation: Conversation;
  messages: Message[];
}

@Injectable()
export class GetThreadUseCase {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: IConversationRepository,
  ) {}

  async execute(tenantId: string, conversationId: string): Promise<ThreadResult> {
    const conversation = await this.conversations.findById(tenantId, conversationId);
    if (!conversation) throw new NotFoundError("Conversación no encontrada");
    const messages = await this.conversations.listMessages(tenantId, conversationId);
    return { conversation, messages };
  }
}

import { Inject, Injectable } from "@nestjs/common";
import {
  CONVERSATION_REPOSITORY,
  ConversationPage,
  IConversationRepository,
} from "../domain/conversation.repository.interface";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

@Injectable()
export class ListConversationsUseCase {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: IConversationRepository,
  ) {}

  execute(tenantId: string, cursor: string | null = null, limit = DEFAULT_LIMIT): Promise<ConversationPage> {
    const safeLimit = Math.min(Math.max(1, limit), MAX_LIMIT);
    return this.conversations.listConversations(tenantId, cursor, safeLimit);
  }
}

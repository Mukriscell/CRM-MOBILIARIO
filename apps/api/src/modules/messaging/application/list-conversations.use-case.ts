import { Inject, Injectable } from "@nestjs/common";
import {
  CONVERSATION_REPOSITORY,
  ConversationWithLast,
  IConversationRepository,
} from "../domain/conversation.repository.interface";

@Injectable()
export class ListConversationsUseCase {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: IConversationRepository,
  ) {}

  execute(tenantId: string): Promise<ConversationWithLast[]> {
    return this.conversations.listConversations(tenantId);
  }
}

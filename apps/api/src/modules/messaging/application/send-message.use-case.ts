import { Inject, Injectable } from "@nestjs/common";
import { Message } from "@prisma/client";
import {
  CONVERSATION_REPOSITORY,
  IConversationRepository,
} from "../domain/conversation.repository.interface";
import {
  IMessagingProvider,
  MESSAGING_PROVIDER,
} from "../domain/messaging-provider.interface";
import { ILeadRepository, LEAD_REPOSITORY } from "../../leads/domain/lead.repository.interface";
import { DomainEventBus } from "../../../shared/events/domain-event-bus";
import { LeadFirstRespondedEvent } from "../../../shared/events/domain-event";
import { NotFoundError } from "../../../shared/errors/domain-error";

const WHATSAPP_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface SendMessageInput {
  tenantId: string;
  conversationId: string;
  body: string;
  userId: string; // corredor que responde (NULL solo para autorespuesta)
}

/**
 * Respuesta del corredor desde la app. Envía por el proveedor, registra el mensaje
 * (append-only) y marca el Tiempo de Primera Respuesta (TTFR) en el lead.
 */
@Injectable()
export class SendMessageUseCase {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: IConversationRepository,
    @Inject(MESSAGING_PROVIDER) private readonly provider: IMessagingProvider,
    @Inject(LEAD_REPOSITORY) private readonly leads: ILeadRepository,
    private readonly events: DomainEventBus,
  ) {}

  async execute(input: SendMessageInput): Promise<Message> {
    const conversation = await this.conversations.findById(input.tenantId, input.conversationId);
    if (!conversation) throw new NotFoundError("Conversación no encontrada");

    const result = await this.provider.send({ to: conversation.waContactPhone, body: input.body });

    const message = await this.conversations.appendMessage({
      tenantId: input.tenantId,
      conversationId: conversation.id,
      direction: "OUTBOUND",
      body: input.body,
      waMessageId: result.providerMessageId,
      sentByUserId: input.userId,
      metadata: { deliveryStatus: result.status, error: result.error },
    });

    const now = new Date();
    await this.conversations.touchLastMessage(
      input.tenantId,
      conversation.id,
      now,
      new Date(now.getTime() + WHATSAPP_WINDOW_MS),
    );

    // TTFR: si esta es la primera respuesta al lead, registrar el tiempo
    if (conversation.leadId) {
      const lead = await this.leads.markFirstResponse(input.tenantId, conversation.leadId, now);
      if (lead) {
        const ttfrSeconds = Math.round((now.getTime() - lead.createdAt.getTime()) / 1000);
        this.events.publish(
          new LeadFirstRespondedEvent(input.tenantId, lead.id, ttfrSeconds, input.userId),
        );
      }
    }

    return message;
  }
}

import { Inject, Injectable, Logger } from "@nestjs/common";
import { normalizeChileanPhone } from "@clientra/shared-utils";
import {
  CONVERSATION_REPOSITORY,
  IConversationRepository,
} from "../domain/conversation.repository.interface";
import { ILeadRepository, LEAD_REPOSITORY } from "../../leads/domain/lead.repository.interface";
import { DomainEventBus } from "../../../shared/events/domain-event-bus";
import { InboundMessageReceivedEvent } from "../../../shared/events/domain-event";

const WHATSAPP_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface InboundMessageInput {
  tenantId: string;
  fromPhone: string;
  body: string;
  waMessageId?: string | null;
}

/**
 * Mensaje entrante de WhatsApp (webhook). Vincula a un lead existente por teléfono,
 * abre/continúa la conversación y registra el mensaje (append-only, idempotente por waMessageId).
 */
@Injectable()
export class ReceiveInboundMessageUseCase {
  private readonly logger = new Logger(ReceiveInboundMessageUseCase.name);

  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: IConversationRepository,
    @Inject(LEAD_REPOSITORY) private readonly leads: ILeadRepository,
    private readonly events: DomainEventBus,
  ) {}

  async execute(input: InboundMessageInput): Promise<void> {
    const phone = normalizeChileanPhone(input.fromPhone) ?? input.fromPhone;

    const lead = await this.leads.findActiveByContact(input.tenantId, phone, null);

    const conversation = await this.conversations.findOrCreateByPhone(
      input.tenantId,
      phone,
      lead?.id ?? null,
      lead?.assignedUserId ?? null,
    );

    await this.conversations.appendMessage({
      tenantId: input.tenantId,
      conversationId: conversation.id,
      direction: "INBOUND",
      body: input.body,
      waMessageId: input.waMessageId ?? null,
      sentByUserId: null,
    });

    const now = new Date();
    await this.conversations.touchLastMessage(
      input.tenantId,
      conversation.id,
      now,
      new Date(now.getTime() + WHATSAPP_WINDOW_MS),
    );

    if (lead) {
      await this.leads.touchActivity(input.tenantId, lead.id, now);
      this.events.publish(new InboundMessageReceivedEvent(input.tenantId, lead.id));
    }

    this.logger.debug(`Mensaje entrante de ${phone} registrado (lead ${lead?.id ?? "sin vincular"})`);
  }
}

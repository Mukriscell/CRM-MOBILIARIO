import { Inject, Injectable, Logger } from "@nestjs/common";
import {
  CONVERSATION_REPOSITORY,
  IConversationRepository,
} from "../domain/conversation.repository.interface";
import {
  IMessagingProvider,
  MESSAGING_PROVIDER,
} from "../domain/messaging-provider.interface";

const WHATSAPP_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface AutoResponseInput {
  tenantId: string;
  leadId: string;
  phone: string;
  firstName?: string | null;
  assignedUserId?: string | null;
}

/**
 * Speed-to-lead (FASE 4): autorespuesta inmediata 24/7 al entrar un lead.
 * Crea/abre la conversación y envía un saludo automático en < 60 s.
 * El mensaje queda como OUTBOUND con sentByUserId NULL (= automático), por lo que
 * NO cuenta como TTFR del corredor (eso es la primera respuesta humana).
 */
@Injectable()
export class SendAutoResponseUseCase {
  private readonly logger = new Logger(SendAutoResponseUseCase.name);

  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: IConversationRepository,
    @Inject(MESSAGING_PROVIDER) private readonly provider: IMessagingProvider,
  ) {}

  async execute(input: AutoResponseInput): Promise<void> {
    if (!input.phone) {
      this.logger.warn(`Lead ${input.leadId} sin teléfono; no se envía autorespuesta`);
      return;
    }

    const conversation = await this.conversations.findOrCreateByPhone(
      input.tenantId,
      input.phone,
      input.leadId,
      input.assignedUserId ?? null,
    );

    const greeting = input.firstName ? `Hola ${input.firstName}` : "Hola";
    const body = `${greeting} 👋, gracias por tu interés. Un asesor te contactará en breve. ¿En qué te podemos ayudar?`;

    const result = await this.provider.send({ to: input.phone, body });

    await this.conversations.appendMessage({
      tenantId: input.tenantId,
      conversationId: conversation.id,
      direction: "OUTBOUND",
      body,
      waMessageId: result.providerMessageId,
      sentByUserId: null, // automático
      metadata: { auto: true, deliveryStatus: result.status },
    });

    const now = new Date();
    await this.conversations.touchLastMessage(
      input.tenantId,
      conversation.id,
      now,
      new Date(now.getTime() + WHATSAPP_WINDOW_MS),
    );
  }
}

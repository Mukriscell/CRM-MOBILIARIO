import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  IMessagingProvider,
  OutboundMessage,
  SendResult,
} from "../domain/messaging-provider.interface";

/**
 * Proveedor de desarrollo: no envía nada real, registra el mensaje en consola
 * y simula una entrega exitosa. Permite probar el flujo completo (autorespuesta,
 * respuesta del corredor, TTFR, Inbox) en local sin credenciales de WhatsApp.
 */
@Injectable()
export class ConsoleMessagingProvider implements IMessagingProvider {
  readonly channel = "console";
  private readonly logger = new Logger(ConsoleMessagingProvider.name);

  async send(message: OutboundMessage): Promise<SendResult> {
    this.logger.log(`📤 [WhatsApp simulado] → ${message.to}: ${message.body}`);
    return { providerMessageId: `console-${randomUUID()}`, status: "SENT" };
  }
}

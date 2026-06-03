export const MESSAGING_PROVIDER = Symbol("MESSAGING_PROVIDER");

export interface OutboundMessage {
  to: string; // teléfono normalizado E.164
  body: string;
}

export interface SendResult {
  /** ID del mensaje en el proveedor (wa_message_id). Null si el proveedor no lo entrega. */
  providerMessageId: string | null;
  status: "SENT" | "FAILED";
  error?: string;
}

/**
 * Abstracción del canal de mensajería (FASE 4: desacoplado del proveedor).
 * Implementaciones: ConsoleMessagingProvider (local) y WhatsAppCloudProvider (producción).
 */
export interface IMessagingProvider {
  readonly channel: string;
  send(message: OutboundMessage): Promise<SendResult>;
}

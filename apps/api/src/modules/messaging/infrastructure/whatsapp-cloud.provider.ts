import { Injectable, Logger } from "@nestjs/common";
import {
  IMessagingProvider,
  OutboundMessage,
  SendResult,
} from "../domain/messaging-provider.interface";

/**
 * Proveedor de producción: WhatsApp Cloud API (Meta Graph API).
 * Se activa cuando WHATSAPP_ACCESS_TOKEN y WHATSAPP_PHONE_NUMBER_ID están definidos.
 * Usa fetch nativo (Node 22) — sin SDK externo.
 */
@Injectable()
export class WhatsAppCloudProvider implements IMessagingProvider {
  readonly channel = "whatsapp";
  private readonly logger = new Logger(WhatsAppCloudProvider.name);
  private readonly token = process.env.WHATSAPP_ACCESS_TOKEN ?? "";
  private readonly phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? "";
  private readonly apiVersion = process.env.WHATSAPP_API_VERSION ?? "v21.0";

  async send(message: OutboundMessage): Promise<SendResult> {
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: message.to.replace(/^\+/, ""),
          type: "text",
          text: { body: message.body },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        this.logger.error(`WhatsApp send falló (${res.status}): ${errText}`);
        return { providerMessageId: null, status: "FAILED", error: errText };
      }

      const data = (await res.json()) as { messages?: Array<{ id: string }> };
      return { providerMessageId: data.messages?.[0]?.id ?? null, status: "SENT" };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.logger.error(`WhatsApp send error: ${error}`);
      return { providerMessageId: null, status: "FAILED", error };
    }
  }
}

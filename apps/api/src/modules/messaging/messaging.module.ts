import { Logger, Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { TenantModule } from "../tenant/tenant.module";
import { LeadsModule } from "../leads/leads.module";
import { CONVERSATION_REPOSITORY } from "./domain/conversation.repository.interface";
import { MESSAGING_PROVIDER } from "./domain/messaging-provider.interface";
import { PrismaConversationRepository } from "./infrastructure/prisma-conversation.repository";
import { ConsoleMessagingProvider } from "./infrastructure/console-messaging.provider";
import { WhatsAppCloudProvider } from "./infrastructure/whatsapp-cloud.provider";
import { SendMessageUseCase } from "./application/send-message.use-case";
import { SendAutoResponseUseCase } from "./application/send-autoresponse.use-case";
import { ReceiveInboundMessageUseCase } from "./application/receive-inbound-message.use-case";
import { ListConversationsUseCase } from "./application/list-conversations.use-case";
import { GetThreadUseCase } from "./application/get-thread.use-case";
import { LeadCreatedAutoResponseListener } from "./infrastructure/lead-created-autoresponse.listener";
import { InboxController } from "./presentation/inbox.controller";
import {
  WhatsAppWebhookController,
  SimulateInboundController,
} from "./presentation/whatsapp-webhook.controller";

/**
 * Módulo de Mensajería (H2): WhatsApp CRM + autorespuesta + TTFR.
 * El proveedor se elige por entorno: WhatsApp Cloud API si hay credenciales,
 * de lo contrario un proveedor de consola que simula el envío (demo local).
 */
@Module({
  imports: [AuthModule, TenantModule, LeadsModule],
  controllers: [InboxController, WhatsAppWebhookController, SimulateInboundController],
  providers: [
    { provide: CONVERSATION_REPOSITORY, useClass: PrismaConversationRepository },
    {
      provide: MESSAGING_PROVIDER,
      useFactory: () => {
        const hasWhatsApp =
          !!process.env.WHATSAPP_ACCESS_TOKEN && !!process.env.WHATSAPP_PHONE_NUMBER_ID;
        const provider = hasWhatsApp ? new WhatsAppCloudProvider() : new ConsoleMessagingProvider();
        new Logger("MessagingModule").log(
          `Proveedor de mensajería: ${hasWhatsApp ? "WhatsApp Cloud API" : "Console (simulado)"}`,
        );
        return provider;
      },
    },
    SendMessageUseCase,
    SendAutoResponseUseCase,
    ReceiveInboundMessageUseCase,
    ListConversationsUseCase,
    GetThreadUseCase,
    LeadCreatedAutoResponseListener,
  ],
})
export class MessagingModule {}

import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { CurrentUser, AuthUser } from "../../../shared/decorators/current-user.decorator";
import { TenantContextService } from "../../../shared/context/tenant-context.service";
import { ListConversationsUseCase } from "../application/list-conversations.use-case";
import { GetThreadUseCase } from "../application/get-thread.use-case";
import { SendMessageUseCase } from "../application/send-message.use-case";
import { ValidationError } from "../../../shared/errors/domain-error";

/**
 * Inbox WhatsApp (FASE 10): conversaciones centralizadas y vinculadas al lead.
 */
@Controller("conversations")
@UseGuards(JwtAuthGuard)
export class InboxController {
  constructor(
    private readonly listConversations: ListConversationsUseCase,
    private readonly getThread: GetThreadUseCase,
    private readonly sendMessage: SendMessageUseCase,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get()
  async list(
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    const tenantId = this.tenantContext.requireTenantId();
    const result = await this.listConversations.execute(tenantId, cursor ?? null, limit ? Number(limit) : undefined);
    return result;
  }

  @Get(":id")
  async thread(
    @Param("id") id: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    const tenantId = this.tenantContext.requireTenantId();
    const result = await this.getThread.execute(tenantId, id, cursor ?? null, limit ? Number(limit) : undefined);
    return result;
  }

  @Post(":id/messages")
  async reply(
    @Param("id") id: string,
    @Body() body: { body?: string },
    @CurrentUser() user: AuthUser,
  ) {
    const tenantId = this.tenantContext.requireTenantId();
    const text = body.body?.trim();
    if (!text) throw new ValidationError("El mensaje no puede estar vacío");
    const message = await this.sendMessage.execute({
      tenantId,
      conversationId: id,
      body: text,
      userId: user.userId,
    });
    return { data: message };
  }
}

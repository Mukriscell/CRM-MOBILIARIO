import { createHmac, timingSafeEqual } from "crypto";
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Inject,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { ReceiveInboundMessageUseCase } from "../application/receive-inbound-message.use-case";
import { ITenantRepository, TENANT_REPOSITORY } from "../../tenant/domain/tenant.repository.interface";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { TenantContextService } from "../../../shared/context/tenant-context.service";
import { NotFoundError, ValidationError } from "../../../shared/errors/domain-error";

/**
 * Webhook de WhatsApp Cloud API (FASE 9).
 * - GET: verificación del webhook por Meta (hub.challenge).
 * - POST: recepción idempotente de mensajes entrantes.
 *
 * En H2 el número de WhatsApp del piloto mapea a un único tenant
 * (WHATSAPP_DEFAULT_TENANT_SLUG). El mapeo multi-número por phone_number_id llega después.
 */
@Controller("messaging/webhook/whatsapp")
export class WhatsAppWebhookController {
  constructor(
    private readonly receiveInbound: ReceiveInboundMessageUseCase,
    @Inject(TENANT_REPOSITORY) private readonly tenants: ITenantRepository,
  ) {}

  /** Verificación del webhook (Meta envía hub.* en el alta). 10/min máximo. */
  @Get()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  verify(
    @Query("hub.mode") mode?: string,
    @Query("hub.verify_token") token?: string,
    @Query("hub.challenge") challenge?: string,
  ): string {
    const expected = process.env.WHATSAPP_VERIFY_TOKEN;
    if (!expected) throw new ValidationError("WHATSAPP_VERIFY_TOKEN no configurado");
    if (mode === "subscribe" && token === expected) {
      return challenge ?? "";
    }
    throw new ValidationError("Verificación de webhook fallida");
  }

  /** Recepción de mensajes entrantes (payload de WhatsApp Cloud API). 200/min — Meta puede enviar ráfagas. */
  @Post()
  @HttpCode(200)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 200, ttl: 60_000 } })
  async inbound(
    @Req() req: Request & { rawBody?: Buffer },
    @Body() payload: any,
    @Headers("x-hub-signature-256") signature?: string,
  ): Promise<{ received: boolean }> {
    // SEC-04: verificar firma HMAC-SHA256 de Meta si el App Secret está configurado
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    if (appSecret) {
      if (!signature || !req.rawBody) {
        throw new ForbiddenException("Firma HMAC ausente");
      }
      const expected = "sha256=" + createHmac("sha256", appSecret).update(req.rawBody).digest("hex");
      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expected);
      if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
        throw new ForbiddenException("Firma HMAC inválida");
      }
    }
    const slug = process.env.WHATSAPP_DEFAULT_TENANT_SLUG ?? "demo";
    const tenant = await this.tenants.findBySlug(slug);
    if (!tenant) throw new NotFoundError("Tenant del webhook no encontrado");

    // Estructura estándar de WhatsApp Cloud API
    const entries = payload?.entry ?? [];
    for (const entry of entries) {
      for (const change of entry?.changes ?? []) {
        for (const msg of change?.value?.messages ?? []) {
          if (msg.type !== "text") continue;
          await this.receiveInbound.execute({
            tenantId: tenant.id,
            fromPhone: msg.from,
            body: msg.text?.body ?? "",
            waMessageId: msg.id ?? null,
          });
        }
      }
    }
    return { received: true };
  }
}

/**
 * Endpoint de DEMO/desarrollo: simula un mensaje entrante del cliente sin WhatsApp real.
 * Autenticado (tenant del JWT) para probar el Inbox y el TTFR en local.
 */
@Controller("messaging/simulate")
@UseGuards(JwtAuthGuard)
export class SimulateInboundController {
  constructor(
    private readonly receiveInbound: ReceiveInboundMessageUseCase,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Post("inbound")
  @HttpCode(202)
  async simulate(@Body() body: { fromPhone?: string; body?: string }): Promise<{ ok: boolean }> {
    // SEC-08: opt-in explícito requerido; NODE_ENV no es suficiente porque puede no setearse en Railway
    if (process.env.ENABLE_SIMULATE_ENDPOINT !== "true") {
      throw new ForbiddenException("Endpoint de simulación deshabilitado");
    }
    const tenantId = this.tenantContext.requireTenantId();
    if (!body.fromPhone || !body.body) {
      throw new ValidationError("fromPhone y body son requeridos");
    }
    await this.receiveInbound.execute({
      tenantId,
      fromPhone: body.fromPhone,
      body: body.body,
    });
    return { ok: true };
  }
}

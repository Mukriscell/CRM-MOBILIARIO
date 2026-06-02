import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Request } from "express";
import { TokenService } from "./token.service";
import { TenantContextService } from "../../../shared/context/tenant-context.service";
import { UnauthorizedError } from "../../../shared/errors/domain-error";

/**
 * Verifica el JWT y puebla request.user + el TenantContext.
 * El tenantId SIEMPRE proviene del token (FASE 9), nunca de un header del cliente.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokens: TokenService,
    private readonly tenantContext: TenantContextService,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<Request>();
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Token ausente");
    }
    try {
      const payload = this.tokens.verifyAccess(header.slice(7));
      (req as any).user = { userId: payload.sub, tenantId: payload.tenantId, role: payload.role };
      this.tenantContext.set({ tenantId: payload.tenantId, userId: payload.sub, role: payload.role });
      return true;
    } catch {
      throw new UnauthorizedError("Token inválido o expirado");
    }
  }
}

import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@clientra/shared-types";
import { ROLES_KEY } from "../../../shared/decorators/roles.decorator";
import { ForbiddenError } from "../../../shared/errors/domain-error";

/** RBAC: valida que el rol del usuario esté permitido para el endpoint (FASE 9). */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const { user } = ctx.switchToHttp().getRequest();
    if (!user || !required.includes(user.role)) {
      throw new ForbiddenError("No tienes permisos para esta acción");
    }
    return true;
  }
}

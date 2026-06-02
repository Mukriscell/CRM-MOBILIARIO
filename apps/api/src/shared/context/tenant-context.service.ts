import { Injectable } from "@nestjs/common";
import { ClsService } from "nestjs-cls";

export interface RequestContext {
  tenantId: string | null;
  userId: string | null;
  role: string | null;
}

/**
 * Contexto por request (tenant + usuario), resuelto desde el JWT por el
 * middleware/guard de auth. Primera barrera de aislamiento multi-tenant (FASE 6).
 */
@Injectable()
export class TenantContextService {
  constructor(private readonly cls: ClsService) {}

  set(ctx: RequestContext): void {
    this.cls.set("ctx", ctx);
  }

  private get(): RequestContext {
    return this.cls.get("ctx") ?? { tenantId: null, userId: null, role: null };
  }

  /** tenantId del request actual; lanza si no hay (uso en recursos tenant-scoped). */
  requireTenantId(): string {
    const { tenantId } = this.get();
    if (!tenantId) throw new Error("Tenant context no disponible");
    return tenantId;
  }

  get tenantId(): string | null {
    return this.get().tenantId;
  }

  get userId(): string | null {
    return this.get().userId;
  }

  get role(): string | null {
    return this.get().role;
  }
}

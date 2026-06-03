import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";

/**
 * Reglas de ruteo (FASE 4: Lead Router Engine).
 * H1: round-robin / menor carga entre corredores activos.
 * H2+: incorporará comuna, tipo de propiedad y disponibilidad horaria.
 */
@Injectable()
export class RoutingRulesService {
  private readonly rrIndex = new Map<string, number>();

  /** Elige el corredor por round-robin, rotando por tenant. */
  pickBroker(brokers: User[], tenantId: string): User | null {
    if (brokers.length === 0) return null;
    const last = this.rrIndex.get(tenantId) ?? -1;
    const next = (last + 1) % brokers.length;
    this.rrIndex.set(tenantId, next);
    return brokers[next];
  }
}

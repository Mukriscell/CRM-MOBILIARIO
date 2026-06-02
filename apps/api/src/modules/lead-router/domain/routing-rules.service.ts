import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";

/**
 * Reglas de ruteo (FASE 4: Lead Router Engine).
 * H1: round-robin / menor carga entre corredores activos.
 * H2+: incorporará comuna, tipo de propiedad y disponibilidad horaria.
 */
@Injectable()
export class RoutingRulesService {
  /** Elige el corredor con menor carga (placeholder: aleatorio estable por ahora). */
  pickBroker(brokers: User[]): User | null {
    if (brokers.length === 0) return null;
    // En H1, round-robin simple por orden de creación; la carga real se evalúa en H2.
    return brokers[0];
  }
}

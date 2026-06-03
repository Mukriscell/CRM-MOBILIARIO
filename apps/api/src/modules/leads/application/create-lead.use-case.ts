import { Inject, Injectable } from "@nestjs/common";
import { Lead, LeadSource } from "@prisma/client";
import { normalizeChileanPhone } from "@clientra/shared-utils";
import { ILeadRepository, LEAD_REPOSITORY } from "../domain/lead.repository.interface";
import { DomainEventBus } from "../../../shared/events/domain-event-bus";
import { LeadCreatedEvent } from "../../../shared/events/domain-event";

export interface CreateLeadInput {
  tenantId: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  source: LeadSource;
  budgetAmount?: number | null;
  budgetCurrency?: "UF" | "CLP";
  rawPayload?: unknown;
}

export interface CreateLeadResult {
  lead: Lead;
  deduplication: "created" | "merged";
}

/**
 * Crea un lead aplicando deduplicación de negocio (FASE 9 §9):
 * si ya existe un lead activo con el mismo teléfono/email, fusiona la consulta
 * (actualiza lastActivityAt) en vez de duplicar. Emite LeadCreated solo si es nuevo.
 */
@Injectable()
export class CreateLeadUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY) private readonly leads: ILeadRepository,
    private readonly events: DomainEventBus,
  ) {}

  async execute(input: CreateLeadInput): Promise<CreateLeadResult> {
    const phone = normalizeChileanPhone(input.phone) ?? input.phone ?? null;

    const existing = await this.leads.findActiveByContact(input.tenantId, phone, input.email ?? null);
    if (existing) {
      await this.leads.touchActivity(input.tenantId, existing.id, new Date());
      return { lead: existing, deduplication: "merged" };
    }

    const lead = await this.leads.create({ ...input, phone });
    this.events.publish(new LeadCreatedEvent(lead.tenantId, lead.id, lead.source));
    return { lead, deduplication: "created" };
  }
}

import { Injectable } from "@nestjs/common";
import { LeadIntakeInput } from "@clientra/shared-types";
import { LeadSource } from "@prisma/client";
import { CreateLeadUseCase } from "../../leads/application/create-lead.use-case";

export interface IngestResult {
  leadId: string;
  deduplication: "created" | "merged";
}

/**
 * Lead Intake Engine (FASE 4): normaliza el payload de cualquier canal y delega
 * la creación (con dedup) al CreateLeadUseCase del módulo Lead. No toca el repo de leads.
 */
@Injectable()
export class IngestLeadUseCase {
  constructor(private readonly createLead: CreateLeadUseCase) {}

  async execute(tenantId: string, input: LeadIntakeInput): Promise<IngestResult> {
    const { lead, deduplication } = await this.createLead.execute({
      tenantId,
      firstName: input.contact.firstName ?? null,
      lastName: input.contact.lastName ?? null,
      email: input.contact.email ?? null,
      phone: input.contact.phone ?? null,
      source: input.source as LeadSource,
      budgetAmount: input.interest?.budget ?? null,
      budgetCurrency: input.interest?.currency ?? "CLP",
      rawPayload: input.raw ?? input,
    });
    return { leadId: lead.id, deduplication };
  }
}

/** Contrato base de los eventos de dominio in-process (FASE 4: sin broker externo). */
export interface DomainEvent {
  readonly name: string;
  readonly tenantId: string;
  readonly occurredAt: Date;
}

export class LeadCreatedEvent implements DomainEvent {
  readonly name = "lead.created";
  readonly occurredAt = new Date();
  constructor(
    readonly tenantId: string,
    readonly leadId: string,
    readonly source: string,
  ) {}
}

export class LeadAssignedEvent implements DomainEvent {
  readonly name = "lead.assigned";
  readonly occurredAt = new Date();
  constructor(
    readonly tenantId: string,
    readonly leadId: string,
    readonly assignedUserId: string,
    readonly assignedBy: "SYSTEM" | "MANUAL",
  ) {}
}

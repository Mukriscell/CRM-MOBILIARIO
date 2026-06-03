import { Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { LeadCreatedEvent } from "../../../shared/events/domain-event";
import { AssignLeadUseCase } from "../../leads/application/assign-lead.use-case";
import { RoutingRulesService } from "../domain/routing-rules.service";
import { IUserRepository, USER_REPOSITORY } from "../../users/domain/user.repository.interface";

/**
 * Asignación automática: escucha LeadCreated y rutea el lead a un corredor
 * (reduce el tiempo a primer contacto — speed-to-lead, FASE 4).
 */
@Injectable()
export class LeadCreatedListener {
  private readonly logger = new Logger(LeadCreatedListener.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    private readonly routing: RoutingRulesService,
    private readonly assignLead: AssignLeadUseCase,
  ) {}

  @OnEvent("lead.created")
  async handle(event: LeadCreatedEvent): Promise<void> {
    const brokers = await this.users.findActiveBrokers(event.tenantId);
    const broker = this.routing.pickBroker(brokers, event.tenantId);
    if (!broker) {
      this.logger.warn(`Sin corredores disponibles para tenant ${event.tenantId}; lead ${event.leadId} sin asignar`);
      return;
    }
    await this.assignLead.execute({
      tenantId: event.tenantId,
      leadId: event.leadId,
      userId: broker.id,
      by: "SYSTEM",
      reason: { rule: "auto-round-robin" },
    });
    this.logger.debug(`Lead ${event.leadId} asignado automáticamente a ${broker.id}`);
  }
}

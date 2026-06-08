import { Inject, Injectable, Logger } from "@nestjs/common";
import { IVisitRepository, VISIT_REPOSITORY } from "../domain/visit.repository.interface";
import { IMessagingProvider, MESSAGING_PROVIDER } from "../../messaging/domain/messaging-provider.interface";

const DATE_FMT = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

@Injectable()
export class SendVisitReminderUseCase {
  private readonly logger = new Logger(SendVisitReminderUseCase.name);

  constructor(
    @Inject(VISIT_REPOSITORY) private readonly visits: IVisitRepository,
    @Inject(MESSAGING_PROVIDER) private readonly provider: IMessagingProvider,
  ) {}

  async execute(tenantId: string, visitId: string, reminderId: string): Promise<void> {
    const reminder = await this.visits.findReminderById(tenantId, reminderId);
    if (!reminder || reminder.status !== "PENDING") {
      this.logger.warn(`Recordatorio ${reminderId} no está PENDING — saltando`);
      return;
    }

    const visit = await this.visits.findById(tenantId, visitId);
    if (!visit) {
      await this.visits.markReminder(tenantId, reminderId, "FAILED");
      this.logger.warn(`Visita ${visitId} no encontrada para recordatorio ${reminderId}`);
      return;
    }

    // No tiene sentido recordar visitas ya canceladas/completadas.
    if (visit.status === "CANCELLED" || visit.status === "NO_SHOW" || visit.status === "COMPLETED") {
      await this.visits.markReminder(tenantId, reminderId, "FAILED");
      return;
    }

    if (!visit.leadPhone) {
      await this.visits.markReminder(tenantId, reminderId, "FAILED");
      this.logger.warn(`Lead de la visita ${visitId} sin teléfono — no se puede enviar recordatorio`);
      return;
    }

    const saludo = visit.leadName ? `Hola ${visit.leadName}` : "Hola";
    const lugar = visit.propertyAddress ?? visit.propertyCode ?? "la propiedad";
    const cuando = DATE_FMT.format(visit.scheduledAt);
    const body = `${saludo} 👋, te recordamos tu visita a ${lugar} el ${cuando}. ¿Confirmas tu asistencia?`;

    const result = await this.provider.send({ to: visit.leadPhone, body });
    await this.visits.markReminder(tenantId, reminderId, result.status === "SENT" ? "SENT" : "FAILED");
    this.logger.log(`Recordatorio ${reminderId} de visita ${visitId}: ${result.status}`);
  }
}

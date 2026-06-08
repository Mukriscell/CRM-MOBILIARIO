import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { AuthModule } from "../auth/auth.module";
import { LeadsModule } from "../leads/leads.module";
import { PropertiesModule } from "../properties/properties.module";
import { MessagingModule } from "../messaging/messaging.module";
import { VISIT_REMINDER_QUEUE } from "./domain/visit.entity";
import { VISIT_REPOSITORY } from "./domain/visit.repository.interface";
import { PrismaVisitRepository } from "./infrastructure/prisma-visit.repository";
import { VisitReminderProcessor } from "./infrastructure/visit-reminder.processor";
import { ListVisitsUseCase } from "./application/list-visits.use-case";
import { GetVisitUseCase } from "./application/get-visit.use-case";
import { ScheduleVisitUseCase } from "./application/schedule-visit.use-case";
import { UpdateVisitStatusUseCase } from "./application/update-visit-status.use-case";
import { SendVisitReminderUseCase } from "./application/send-visit-reminder.use-case";
import { VisitController } from "./presentation/visit.controller";

/**
 * Módulo de Visitas: agenda visitas a propiedades, mueve el lead a VISITA_AGENDADA
 * y programa recordatorios automáticos (BullMQ). Reutiliza LEAD_REPOSITORY,
 * PROPERTY_REPOSITORY y MESSAGING_PROVIDER de sus módulos dueños.
 */
@Module({
  imports: [
    AuthModule,
    LeadsModule,
    PropertiesModule,
    MessagingModule,
    BullModule.registerQueue({ name: VISIT_REMINDER_QUEUE }),
  ],
  controllers: [VisitController],
  providers: [
    { provide: VISIT_REPOSITORY, useClass: PrismaVisitRepository },
    VisitReminderProcessor,
    ListVisitsUseCase,
    GetVisitUseCase,
    ScheduleVisitUseCase,
    UpdateVisitStatusUseCase,
    SendVisitReminderUseCase,
  ],
})
export class VisitsModule {}

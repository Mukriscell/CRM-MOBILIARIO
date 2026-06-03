import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { AuthModule } from "../auth/auth.module";
import { FOLLOW_UP_QUEUE } from "./domain/follow-up.entity";
import { FOLLOW_UP_REPOSITORY } from "./domain/follow-up.repository.interface";
import { PrismaFollowUpRepository } from "./infrastructure/prisma-follow-up.repository";
import { FollowUpProcessor } from "./infrastructure/follow-up.processor";
import { LeadCreatedFollowUpListener } from "./infrastructure/lead-created-followup.listener";
import { InboundMessageFollowUpListener } from "./infrastructure/inbound-message-followup.listener";
import { ScheduleFollowUpUseCase } from "./application/schedule-follow-up.use-case";
import { CancelFollowUpUseCase } from "./application/cancel-follow-up.use-case";
import { ExecuteFollowUpUseCase } from "./application/execute-follow-up.use-case";
import { ListFollowUpsUseCase } from "./application/list-follow-ups.use-case";
import { GetFollowUpStatsUseCase } from "./application/get-follow-up-stats.use-case";
import { FollowUpController } from "./presentation/follow-up.controller";

@Module({
  imports: [
    AuthModule,
    BullModule.registerQueue({ name: FOLLOW_UP_QUEUE }),
  ],
  controllers: [FollowUpController],
  providers: [
    { provide: FOLLOW_UP_REPOSITORY, useClass: PrismaFollowUpRepository },
    FollowUpProcessor,
    LeadCreatedFollowUpListener,
    InboundMessageFollowUpListener,
    ScheduleFollowUpUseCase,
    CancelFollowUpUseCase,
    ExecuteFollowUpUseCase,
    ListFollowUpsUseCase,
    GetFollowUpStatsUseCase,
  ],
})
export class FollowUpModule {}

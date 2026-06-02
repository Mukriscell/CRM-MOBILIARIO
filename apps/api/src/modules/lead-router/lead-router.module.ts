import { Module } from "@nestjs/common";
import { LeadsModule } from "../leads/leads.module";
import { UsersModule } from "../users/users.module";
import { AuthModule } from "../auth/auth.module";
import { RoutingRulesService } from "./domain/routing-rules.service";
import { LeadCreatedListener } from "./infrastructure/lead-created.listener";
import { LeadRouterController } from "./presentation/lead-router.controller";

@Module({
  imports: [LeadsModule, UsersModule, AuthModule],
  controllers: [LeadRouterController],
  providers: [RoutingRulesService, LeadCreatedListener],
})
export class LeadRouterModule {}

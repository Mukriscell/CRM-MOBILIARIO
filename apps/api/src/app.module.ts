import { Module } from "@nestjs/common";
import { ClsModule } from "nestjs-cls";
import { DatabaseModule } from "./infrastructure/database/database.module";
import { HealthModule } from "./infrastructure/health/health.module";
import { ContextModule } from "./shared/context/context.module";
import { EventsModule } from "./shared/events/events.module";
import { AuthModule } from "./modules/auth/auth.module";
import { TenantModule } from "./modules/tenant/tenant.module";
import { UsersModule } from "./modules/users/users.module";
import { LeadsModule } from "./modules/leads/leads.module";
import { LeadIntakeModule } from "./modules/lead-intake/lead-intake.module";
import { LeadRouterModule } from "./modules/lead-router/lead-router.module";

@Module({
  imports: [
    // Contexto por request (tenant + user) vía AsyncLocalStorage
    ClsModule.forRoot({ global: true, middleware: { mount: true } }),
    DatabaseModule,
    HealthModule,
    ContextModule,
    EventsModule,
    AuthModule,
    TenantModule,
    UsersModule,
    LeadsModule,
    LeadIntakeModule,
    LeadRouterModule,
  ],
})
export class AppModule {}

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ClsModule } from "nestjs-cls";
import { BullModule } from "@nestjs/bullmq";
import { ThrottlerModule } from "@nestjs/throttler";
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
import { MessagingModule } from "./modules/messaging/messaging.module";
import { LeadScoringModule } from "./modules/lead-scoring/lead-scoring.module";
import { FollowUpModule } from "./modules/follow-up/follow-up.module";
import { LeadRecoveryModule } from "./modules/lead-recovery/lead-recovery.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate limiting global: límites base que los endpoints sobreescriben con @Throttle
    ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 120 }]),
    // Contexto por request (tenant + user) vía AsyncLocalStorage
    ClsModule.forRoot({ global: true, middleware: { mount: true } }),
    // Cola BullMQ global — conexión Redis compartida
    BullModule.forRootAsync({
      useFactory: () => {
        const url = process.env.REDIS_URL ?? "redis://localhost:6379";
        const parsed = new URL(url);
        // Railway puede usar rediss:// (TLS) o redis:// con password en la URL
        const isTls = url.startsWith("rediss://");
        return {
          connection: {
            host: parsed.hostname,
            port: parseInt(parsed.port || "6379"),
            password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
            username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
            db: parsed.pathname && parsed.pathname !== "/" ? (parseInt(parsed.pathname.slice(1)) || 0) : 0,
            tls: isTls ? { rejectUnauthorized: false } : undefined,
            maxRetriesPerRequest: null,
          },
        };
      },
    }),
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
    MessagingModule,
    LeadScoringModule,
    FollowUpModule,
    LeadRecoveryModule,
  ],
})
export class AppModule {}

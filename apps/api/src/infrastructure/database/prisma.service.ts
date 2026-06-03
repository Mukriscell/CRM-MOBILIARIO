import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/**
 * Cliente Prisma singleton. El aislamiento multi-tenant se aplica en los
 * repositorios usando el TenantContextService (FASE 6: barrera de aplicación).
 * RLS de PostgreSQL se habilita por migración SQL (barrera de base de datos).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

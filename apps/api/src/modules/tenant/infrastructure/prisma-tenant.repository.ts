import { Injectable } from "@nestjs/common";
import { Tenant } from "@prisma/client";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { ITenantRepository } from "../domain/tenant.repository.interface";

@Injectable()
export class PrismaTenantRepository implements ITenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBySlug(slug: string): Promise<Tenant | null> {
    return this.prisma.tenant.findFirst({ where: { slug, deletedAt: null } });
  }

  findById(id: string): Promise<Tenant | null> {
    return this.prisma.tenant.findFirst({ where: { id, deletedAt: null } });
  }

  findByWebhookApiKey(key: string): Promise<Tenant | null> {
    return this.prisma.tenant.findFirst({ where: { webhookApiKey: key, deletedAt: null } });
  }

  async setWebhookApiKey(id: string, key: string): Promise<void> {
    await this.prisma.tenant.update({ where: { id }, data: { webhookApiKey: key } });
  }
}

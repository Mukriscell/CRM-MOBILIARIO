import { Tenant } from "@prisma/client";

export const TENANT_REPOSITORY = Symbol("TENANT_REPOSITORY");

export interface ITenantRepository {
  findBySlug(slug: string): Promise<Tenant | null>;
  findById(id: string): Promise<Tenant | null>;
  findByWebhookApiKey(key: string): Promise<Tenant | null>;
  setWebhookApiKey(id: string, key: string): Promise<void>;
}

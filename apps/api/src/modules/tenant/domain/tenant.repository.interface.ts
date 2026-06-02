import { Tenant } from "@prisma/client";

export const TENANT_REPOSITORY = Symbol("TENANT_REPOSITORY");

export interface ITenantRepository {
  findBySlug(slug: string): Promise<Tenant | null>;
  findById(id: string): Promise<Tenant | null>;
}

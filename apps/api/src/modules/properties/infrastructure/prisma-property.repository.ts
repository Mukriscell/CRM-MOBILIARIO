import { Injectable } from "@nestjs/common";
import type { Property, Prisma } from "@prisma/client";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { ConflictError, NotFoundError } from "../../../shared/errors/domain-error";
import { IPropertyRepository } from "../domain/property.repository.interface";
import {
  CreatePropertyInput,
  PropertyListFilters,
  PropertyView,
  UpdatePropertyInput,
} from "../domain/property.entity";

function toView(p: Property): PropertyView {
  return {
    id: p.id,
    tenantId: p.tenantId,
    internalCode: p.internalCode,
    type: p.type,
    status: p.status,
    address: p.address,
    region: p.region,
    commune: p.commune,
    priceAmount: p.priceAmount ? Number(p.priceAmount) : null,
    priceCurrency: p.priceCurrency,
    areaBuiltM2: p.areaBuiltM2,
    areaTotalM2: p.areaTotalM2,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    description: p.description,
    assignedUserId: p.assignedUserId,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

@Injectable()
export class PrismaPropertyRepository implements IPropertyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, filters: PropertyListFilters = {}): Promise<PropertyView[]> {
    const where: Prisma.PropertyWhereInput = { tenantId, deletedAt: null };
    if (filters.status) where.status = filters.status as Property["status"];
    if (filters.type) where.type = filters.type as Property["type"];
    if (filters.commune) where.commune = filters.commune;

    const rows = await this.prisma.property.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toView);
  }

  async findById(tenantId: string, id: string): Promise<PropertyView | null> {
    const row = await this.prisma.property.findFirst({ where: { id, tenantId, deletedAt: null } });
    return row ? toView(row) : null;
  }

  async create(tenantId: string, input: CreatePropertyInput): Promise<PropertyView> {
    try {
      const row = await this.prisma.property.create({
        data: {
          tenantId,
          internalCode: input.internalCode,
          type: input.type,
          status: input.status ?? "ACTIVA",
          address: input.address ?? null,
          region: input.region ?? null,
          commune: input.commune ?? null,
          priceAmount: input.priceAmount ?? null,
          priceCurrency: input.priceCurrency ?? "UF",
          areaBuiltM2: input.areaBuiltM2 ?? null,
          areaTotalM2: input.areaTotalM2 ?? null,
          bedrooms: input.bedrooms ?? null,
          bathrooms: input.bathrooms ?? null,
          description: input.description ?? null,
          assignedUserId: input.assignedUserId ?? null,
        },
      });
      return toView(row);
    } catch (e: any) {
      // P2002: viola @@unique([tenantId, internalCode])
      if (e?.code === "P2002") {
        throw new ConflictError(`Ya existe una propiedad con el código ${input.internalCode}`);
      }
      throw e;
    }
  }

  async update(tenantId: string, id: string, patch: UpdatePropertyInput): Promise<PropertyView> {
    // Barrera de aislamiento: verifica pertenencia al tenant antes de mutar.
    const existing = await this.prisma.property.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!existing) throw new NotFoundError(`Propiedad ${id} no encontrada`);

    try {
      const row = await this.prisma.property.update({
        where: { id },
        data: {
          internalCode: patch.internalCode ?? undefined,
          type: patch.type ?? undefined,
          status: patch.status ?? undefined,
          address: patch.address === undefined ? undefined : patch.address,
          region: patch.region === undefined ? undefined : patch.region,
          commune: patch.commune === undefined ? undefined : patch.commune,
          priceAmount: patch.priceAmount === undefined ? undefined : patch.priceAmount,
          priceCurrency: patch.priceCurrency ?? undefined,
          areaBuiltM2: patch.areaBuiltM2 === undefined ? undefined : patch.areaBuiltM2,
          areaTotalM2: patch.areaTotalM2 === undefined ? undefined : patch.areaTotalM2,
          bedrooms: patch.bedrooms === undefined ? undefined : patch.bedrooms,
          bathrooms: patch.bathrooms === undefined ? undefined : patch.bathrooms,
          description: patch.description === undefined ? undefined : patch.description,
          assignedUserId: patch.assignedUserId === undefined ? undefined : patch.assignedUserId,
        },
      });
      return toView(row);
    } catch (e: any) {
      if (e?.code === "P2002") {
        throw new ConflictError(`Ya existe una propiedad con el código ${patch.internalCode}`);
      }
      throw e;
    }
  }

  async softDelete(tenantId: string, id: string): Promise<void> {
    const result = await this.prisma.property.updateMany({
      where: { id, tenantId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) throw new NotFoundError(`Propiedad ${id} no encontrada`);
  }
}

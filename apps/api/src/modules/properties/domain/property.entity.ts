import { PropertyStatus, PropertyType, PriceCurrency } from "@prisma/client";

/** Vista de dominio de una propiedad (Decimal serializado a number para la API). */
export interface PropertyView {
  id: string;
  tenantId: string;
  internalCode: string;
  type: PropertyType;
  status: PropertyStatus;
  address: string | null;
  region: string | null;
  commune: string | null;
  priceAmount: number | null;
  priceCurrency: PriceCurrency;
  areaBuiltM2: number | null;
  areaTotalM2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  description: string | null;
  assignedUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePropertyInput {
  internalCode: string;
  type: PropertyType;
  status?: PropertyStatus;
  address?: string | null;
  region?: string | null;
  commune?: string | null;
  priceAmount?: number | null;
  priceCurrency?: PriceCurrency;
  areaBuiltM2?: number | null;
  areaTotalM2?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  description?: string | null;
  assignedUserId?: string | null;
}

export type UpdatePropertyInput = Partial<CreatePropertyInput>;

export interface PropertyListFilters {
  status?: string;
  type?: string;
  commune?: string;
}

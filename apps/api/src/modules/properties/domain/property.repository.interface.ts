import {
  CreatePropertyInput,
  PropertyListFilters,
  PropertyView,
  UpdatePropertyInput,
} from "./property.entity";

export const PROPERTY_REPOSITORY = Symbol("PROPERTY_REPOSITORY");

export interface IPropertyRepository {
  list(tenantId: string, filters?: PropertyListFilters): Promise<PropertyView[]>;
  findById(tenantId: string, id: string): Promise<PropertyView | null>;
  /** Crea una propiedad. Lanza ConflictError si internalCode ya existe en el tenant. */
  create(tenantId: string, input: CreatePropertyInput): Promise<PropertyView>;
  update(tenantId: string, id: string, patch: UpdatePropertyInput): Promise<PropertyView>;
  softDelete(tenantId: string, id: string): Promise<void>;
}

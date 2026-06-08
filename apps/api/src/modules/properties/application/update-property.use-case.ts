import { Inject, Injectable } from "@nestjs/common";
import { PropertyStatus, PropertyType, PriceCurrency } from "@prisma/client";
import { IPropertyRepository, PROPERTY_REPOSITORY } from "../domain/property.repository.interface";
import { PropertyView, UpdatePropertyInput } from "../domain/property.entity";
import { ValidationError } from "../../../shared/errors/domain-error";

const VALID_TYPES = Object.values(PropertyType) as string[];
const VALID_STATUSES = Object.values(PropertyStatus) as string[];
const VALID_CURRENCIES = Object.values(PriceCurrency) as string[];

@Injectable()
export class UpdatePropertyUseCase {
  constructor(@Inject(PROPERTY_REPOSITORY) private readonly repo: IPropertyRepository) {}

  execute(tenantId: string, id: string, patch: UpdatePropertyInput): Promise<PropertyView> {
    if (patch.type && !VALID_TYPES.includes(patch.type)) {
      throw new ValidationError(`Tipo de propiedad inválido: ${patch.type}`);
    }
    if (patch.status && !VALID_STATUSES.includes(patch.status)) {
      throw new ValidationError(`Estado de propiedad inválido: ${patch.status}`);
    }
    if (patch.priceCurrency && !VALID_CURRENCIES.includes(patch.priceCurrency)) {
      throw new ValidationError(`Moneda inválida: ${patch.priceCurrency}`);
    }
    if (patch.internalCode !== undefined && !patch.internalCode.trim()) {
      throw new ValidationError("El código interno no puede estar vacío");
    }
    return this.repo.update(tenantId, id, patch);
  }
}

import { Inject, Injectable } from "@nestjs/common";
import { PropertyStatus, PropertyType, PriceCurrency } from "@prisma/client";
import { IPropertyRepository, PROPERTY_REPOSITORY } from "../domain/property.repository.interface";
import { CreatePropertyInput, PropertyView } from "../domain/property.entity";
import { ValidationError } from "../../../shared/errors/domain-error";

const VALID_TYPES = Object.values(PropertyType) as string[];
const VALID_STATUSES = Object.values(PropertyStatus) as string[];
const VALID_CURRENCIES = Object.values(PriceCurrency) as string[];

@Injectable()
export class CreatePropertyUseCase {
  constructor(@Inject(PROPERTY_REPOSITORY) private readonly repo: IPropertyRepository) {}

  execute(tenantId: string, input: CreatePropertyInput): Promise<PropertyView> {
    if (!input.internalCode?.trim()) {
      throw new ValidationError("El código interno es requerido");
    }
    if (!input.type || !VALID_TYPES.includes(input.type)) {
      throw new ValidationError(`Tipo de propiedad inválido: ${input.type}`);
    }
    if (input.status && !VALID_STATUSES.includes(input.status)) {
      throw new ValidationError(`Estado de propiedad inválido: ${input.status}`);
    }
    if (input.priceCurrency && !VALID_CURRENCIES.includes(input.priceCurrency)) {
      throw new ValidationError(`Moneda inválida: ${input.priceCurrency}`);
    }
    return this.repo.create(tenantId, { ...input, internalCode: input.internalCode.trim() });
  }
}

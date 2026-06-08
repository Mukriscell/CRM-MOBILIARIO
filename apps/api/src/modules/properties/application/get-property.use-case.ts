import { Inject, Injectable } from "@nestjs/common";
import { IPropertyRepository, PROPERTY_REPOSITORY } from "../domain/property.repository.interface";
import { PropertyView } from "../domain/property.entity";
import { NotFoundError } from "../../../shared/errors/domain-error";

@Injectable()
export class GetPropertyUseCase {
  constructor(@Inject(PROPERTY_REPOSITORY) private readonly repo: IPropertyRepository) {}

  async execute(tenantId: string, id: string): Promise<PropertyView> {
    const property = await this.repo.findById(tenantId, id);
    if (!property) throw new NotFoundError(`Propiedad ${id} no encontrada`);
    return property;
  }
}

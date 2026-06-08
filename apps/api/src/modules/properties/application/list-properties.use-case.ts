import { Inject, Injectable } from "@nestjs/common";
import { IPropertyRepository, PROPERTY_REPOSITORY } from "../domain/property.repository.interface";
import { PropertyListFilters, PropertyView } from "../domain/property.entity";

@Injectable()
export class ListPropertiesUseCase {
  constructor(@Inject(PROPERTY_REPOSITORY) private readonly repo: IPropertyRepository) {}

  execute(tenantId: string, filters?: PropertyListFilters): Promise<PropertyView[]> {
    return this.repo.list(tenantId, filters);
  }
}

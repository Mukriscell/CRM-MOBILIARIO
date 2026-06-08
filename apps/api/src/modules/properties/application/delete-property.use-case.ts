import { Inject, Injectable } from "@nestjs/common";
import { IPropertyRepository, PROPERTY_REPOSITORY } from "../domain/property.repository.interface";

@Injectable()
export class DeletePropertyUseCase {
  constructor(@Inject(PROPERTY_REPOSITORY) private readonly repo: IPropertyRepository) {}

  execute(tenantId: string, id: string): Promise<void> {
    return this.repo.softDelete(tenantId, id);
  }
}

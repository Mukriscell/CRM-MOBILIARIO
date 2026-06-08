import { Inject, Injectable } from "@nestjs/common";
import { IVisitRepository, VISIT_REPOSITORY } from "../domain/visit.repository.interface";
import { VisitListFilters, VisitView } from "../domain/visit.entity";

@Injectable()
export class ListVisitsUseCase {
  constructor(@Inject(VISIT_REPOSITORY) private readonly visits: IVisitRepository) {}

  execute(tenantId: string, filters?: VisitListFilters): Promise<VisitView[]> {
    return this.visits.list(tenantId, filters);
  }
}

import { Inject, Injectable } from "@nestjs/common";
import { IVisitRepository, VISIT_REPOSITORY } from "../domain/visit.repository.interface";
import { VisitView } from "../domain/visit.entity";
import { NotFoundError } from "../../../shared/errors/domain-error";

@Injectable()
export class GetVisitUseCase {
  constructor(@Inject(VISIT_REPOSITORY) private readonly visits: IVisitRepository) {}

  async execute(tenantId: string, id: string): Promise<VisitView> {
    const visit = await this.visits.findById(tenantId, id);
    if (!visit) throw new NotFoundError(`Visita ${id} no encontrada`);
    return visit;
  }
}

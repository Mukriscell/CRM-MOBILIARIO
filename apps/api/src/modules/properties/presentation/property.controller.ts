import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@clientra/shared-types";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { RolesGuard } from "../../auth/infrastructure/roles.guard";
import { Roles } from "../../../shared/decorators/roles.decorator";
import { TenantContextService } from "../../../shared/context/tenant-context.service";
import { ListPropertiesUseCase } from "../application/list-properties.use-case";
import { GetPropertyUseCase } from "../application/get-property.use-case";
import { CreatePropertyUseCase } from "../application/create-property.use-case";
import { UpdatePropertyUseCase } from "../application/update-property.use-case";
import { DeletePropertyUseCase } from "../application/delete-property.use-case";
import { CreatePropertyInput, UpdatePropertyInput } from "../domain/property.entity";

/** Catálogo de propiedades del tenant. Base para agendar visitas. */
@Controller("properties")
@UseGuards(JwtAuthGuard)
export class PropertyController {
  constructor(
    private readonly listProperties: ListPropertiesUseCase,
    private readonly getProperty: GetPropertyUseCase,
    private readonly createProperty: CreatePropertyUseCase,
    private readonly updateProperty: UpdatePropertyUseCase,
    private readonly deleteProperty: DeletePropertyUseCase,
    private readonly ctx: TenantContextService,
  ) {}

  @Get()
  async list(
    @Query("status") status?: string,
    @Query("type") type?: string,
    @Query("commune") commune?: string,
  ) {
    const tenantId = this.ctx.requireTenantId();
    return { data: await this.listProperties.execute(tenantId, { status, type, commune }) };
  }

  @Get(":id")
  async detail(@Param("id") id: string) {
    return { data: await this.getProperty.execute(this.ctx.requireTenantId(), id) };
  }

  @Post()
  @HttpCode(201)
  async create(@Body() body: CreatePropertyInput) {
    return { data: await this.createProperty.execute(this.ctx.requireTenantId(), body) };
  }

  @Patch(":id")
  @HttpCode(200)
  async update(@Param("id") id: string, @Body() body: UpdatePropertyInput) {
    return { data: await this.updateProperty.execute(this.ctx.requireTenantId(), id, body) };
  }

  /** DELETE /api/v1/properties/:id — soft delete. Solo ADMIN. */
  @Delete(":id")
  @HttpCode(200)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param("id") id: string): Promise<{ ok: boolean }> {
    await this.deleteProperty.execute(this.ctx.requireTenantId(), id);
    return { ok: true };
  }
}

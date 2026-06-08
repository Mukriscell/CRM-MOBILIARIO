import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PROPERTY_REPOSITORY } from "./domain/property.repository.interface";
import { PrismaPropertyRepository } from "./infrastructure/prisma-property.repository";
import { ListPropertiesUseCase } from "./application/list-properties.use-case";
import { GetPropertyUseCase } from "./application/get-property.use-case";
import { CreatePropertyUseCase } from "./application/create-property.use-case";
import { UpdatePropertyUseCase } from "./application/update-property.use-case";
import { DeletePropertyUseCase } from "./application/delete-property.use-case";
import { PropertyController } from "./presentation/property.controller";

@Module({
  imports: [AuthModule],
  controllers: [PropertyController],
  providers: [
    { provide: PROPERTY_REPOSITORY, useClass: PrismaPropertyRepository },
    ListPropertiesUseCase,
    GetPropertyUseCase,
    CreatePropertyUseCase,
    UpdatePropertyUseCase,
    DeletePropertyUseCase,
  ],
  exports: [PROPERTY_REPOSITORY],
})
export class PropertiesModule {}

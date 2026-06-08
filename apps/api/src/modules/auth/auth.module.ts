import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { UsersModule } from "../users/users.module";
import { TokenService } from "./infrastructure/token.service";
import { JwtAuthGuard } from "./infrastructure/jwt-auth.guard";
import { RolesGuard } from "./infrastructure/roles.guard";
import { PrismaSessionRepository } from "./infrastructure/prisma-session.repository";
import { SESSION_REPOSITORY } from "./domain/session.repository.interface";
import { LoginUseCase } from "./application/login.use-case";
import { RefreshUseCase } from "./application/refresh.use-case";
import { LogoutUseCase } from "./application/logout.use-case";
import { AuthController } from "./presentation/auth.controller";

@Module({
  imports: [JwtModule.register({}), UsersModule],
  controllers: [AuthController],
  providers: [
    TokenService,
    JwtAuthGuard,
    RolesGuard,
    { provide: SESSION_REPOSITORY, useClass: PrismaSessionRepository },
    LoginUseCase,
    RefreshUseCase,
    LogoutUseCase,
  ],
  exports: [TokenService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}

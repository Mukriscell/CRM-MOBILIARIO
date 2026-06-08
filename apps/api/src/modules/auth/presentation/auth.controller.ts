import { Body, Controller, HttpCode, Post, UseGuards, UsePipes } from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { LoginSchema, LoginInput } from "@clientra/shared-types";
import { LoginUseCase, LoginResult } from "../application/login.use-case";
import { RefreshUseCase, RefreshResult } from "../application/refresh.use-case";
import { LogoutUseCase } from "../application/logout.use-case";
import { ZodValidationPipe } from "../../../shared/pipes/zod-validation.pipe";

@Controller("auth")
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly login: LoginUseCase,
    private readonly refresh: RefreshUseCase,
    private readonly logout: LogoutUseCase,
  ) {}

  /** 5 intentos por minuto por IP — protección anti-fuerza bruta (LLM04/SEC-07). */
  @Post("login")
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async loginHandler(@Body() body: LoginInput): Promise<{ data: LoginResult }> {
    return { data: await this.login.execute(body) };
  }

  /** 10 renovaciones por minuto por IP. */
  @Post("refresh")
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async refreshHandler(@Body() body: { refreshToken: string }): Promise<{ data: RefreshResult }> {
    return { data: await this.refresh.execute(body.refreshToken) };
  }

  /** Revoca la sesión del refresh token enviado (SEC-03). 20/min por IP. */
  @Post("logout")
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async logoutHandler(@Body() body: { refreshToken: string }): Promise<{ ok: boolean }> {
    await this.logout.execute(body.refreshToken);
    return { ok: true };
  }
}

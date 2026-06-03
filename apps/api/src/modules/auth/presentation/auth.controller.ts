import { Body, Controller, HttpCode, Post, UsePipes } from "@nestjs/common";
import { LoginSchema, LoginInput } from "@clientra/shared-types";
import { LoginUseCase, LoginResult } from "../application/login.use-case";
import { RefreshUseCase, RefreshResult } from "../application/refresh.use-case";
import { ZodValidationPipe } from "../../../shared/pipes/zod-validation.pipe";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly login: LoginUseCase,
    private readonly refresh: RefreshUseCase,
  ) {}

  @Post("login")
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async loginHandler(@Body() body: LoginInput): Promise<{ data: LoginResult }> {
    return { data: await this.login.execute(body) };
  }

  @Post("refresh")
  @HttpCode(200)
  refreshHandler(@Body() body: { refreshToken: string }): { data: RefreshResult } {
    return { data: this.refresh.execute(body.refreshToken) };
  }
}

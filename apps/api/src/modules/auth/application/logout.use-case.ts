import { createHash } from "crypto";
import { Inject, Injectable } from "@nestjs/common";
import { ISessionRepository, SESSION_REPOSITORY } from "../domain/session.repository.interface";
import { TokenService } from "../infrastructure/token.service";
import { UnauthorizedError } from "../../../shared/errors/domain-error";

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessions: ISessionRepository,
    private readonly tokens: TokenService,
  ) {}

  async execute(refreshToken: string): Promise<void> {
    try {
      this.tokens.verifyRefresh(refreshToken);
    } catch {
      throw new UnauthorizedError("Token de refresco inválido");
    }
    const hash = createHash("sha256").update(refreshToken).digest("hex");
    const session = await this.sessions.findActiveByHash(hash);
    if (session) {
      await this.sessions.revoke(session.id);
    }
    // Si no hay sesión activa, el logout es no-op (idempotente)
  }
}

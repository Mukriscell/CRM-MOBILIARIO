import { createHash } from "crypto";
import { Inject, Injectable } from "@nestjs/common";
import { TokenService, JwtPayload } from "../infrastructure/token.service";
import { ISessionRepository, SESSION_REPOSITORY } from "../domain/session.repository.interface";
import { UnauthorizedError } from "../../../shared/errors/domain-error";

const REFRESH_TTL_DAYS = parseInt(process.env.JWT_REFRESH_DAYS ?? "7", 10);

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class RefreshUseCase {
  constructor(
    private readonly tokens: TokenService,
    @Inject(SESSION_REPOSITORY) private readonly sessions: ISessionRepository,
  ) {}

  async execute(refreshToken: string): Promise<RefreshResult> {
    let payload: JwtPayload;
    try {
      payload = this.tokens.verifyRefresh(refreshToken);
    } catch {
      throw new UnauthorizedError("Token de refresco inválido o expirado");
    }

    // SEC-03: verificar que la sesión existe y no fue revocada
    const hash = createHash("sha256").update(refreshToken).digest("hex");
    const session = await this.sessions.findActiveByHash(hash);
    if (!session) {
      throw new UnauthorizedError("Sesión revocada o expirada");
    }

    // Revocar sesión anterior (rotación de token)
    await this.sessions.revoke(session.id);

    const next: JwtPayload = { sub: payload.sub, tenantId: payload.tenantId, role: payload.role };
    const newRefreshToken = this.tokens.signRefresh(next);

    // Persistir nueva sesión
    await this.sessions.create({
      userId: payload.sub,
      tenantId: payload.tenantId,
      refreshTokenHash: createHash("sha256").update(newRefreshToken).digest("hex"),
      expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000),
    });

    return {
      accessToken: this.tokens.signAccess(next),
      refreshToken: newRefreshToken,
      expiresIn: 900,
    };
  }
}

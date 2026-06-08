import { createHash } from "crypto";
import { Inject, Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { LoginInput } from "@clientra/shared-types";
import { IUserRepository, USER_REPOSITORY } from "../../users/domain/user.repository.interface";
import { ISessionRepository, SESSION_REPOSITORY } from "../domain/session.repository.interface";
import { TokenService } from "../infrastructure/token.service";
import { UnauthorizedError } from "../../../shared/errors/domain-error";

const REFRESH_TTL_DAYS = parseInt(process.env.JWT_REFRESH_DAYS ?? "7", 10);

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: { id: string; firstName: string; role: string; tenantId: string | null };
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessions: ISessionRepository,
    private readonly tokens: TokenService,
  ) {}

  async execute(input: LoginInput): Promise<LoginResult> {
    // Búsqueda cross-tenant por email (un email puede existir en varios tenants;
    // en H1 asumimos email único global para login simple; multi-membresía es post-MVP).
    const user = await this.users.findByEmail(null, input.email);
    if (!user || user.status !== "ACTIVE") {
      throw new UnauthorizedError("Credenciales inválidas");
    }
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedError("Credenciales inválidas");
    }

    const payload = { sub: user.id, tenantId: user.tenantId, role: user.role };
    const accessToken = this.tokens.signAccess(payload);
    const refreshToken = this.tokens.signRefresh(payload);

    // SEC-03: persistir hash del refresh token para poder revocarlo
    await this.sessions.create({
      userId: user.id,
      tenantId: user.tenantId,
      refreshTokenHash: createHash("sha256").update(refreshToken).digest("hex"),
      expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      user: { id: user.id, firstName: user.firstName, role: user.role, tenantId: user.tenantId },
    };
  }
}

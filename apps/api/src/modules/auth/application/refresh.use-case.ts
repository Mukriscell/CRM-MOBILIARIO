import { Injectable, UnauthorizedException } from "@nestjs/common";
import { TokenService, JwtPayload } from "../infrastructure/token.service";

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class RefreshUseCase {
  constructor(private readonly tokens: TokenService) {}

  execute(refreshToken: string): RefreshResult {
    let payload: JwtPayload;
    try {
      payload = this.tokens.verifyRefresh(refreshToken);
    } catch {
      throw new UnauthorizedException("Token de refresco inválido o expirado");
    }
    const next: JwtPayload = { sub: payload.sub, tenantId: payload.tenantId, role: payload.role };
    return {
      accessToken: this.tokens.signAccess(next),
      refreshToken: this.tokens.signRefresh(next),
      expiresIn: 900,
    };
  }
}

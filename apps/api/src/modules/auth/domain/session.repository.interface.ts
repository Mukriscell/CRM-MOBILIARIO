export const SESSION_REPOSITORY = Symbol("SESSION_REPOSITORY");

export interface CreateSessionData {
  userId: string;
  tenantId: string | null;
  refreshTokenHash: string;
  expiresAt: Date;
}

export interface ISessionRepository {
  create(data: CreateSessionData): Promise<{ id: string }>;
  findActiveByHash(hash: string): Promise<{ id: string } | null>;
  revoke(id: string): Promise<void>;
}

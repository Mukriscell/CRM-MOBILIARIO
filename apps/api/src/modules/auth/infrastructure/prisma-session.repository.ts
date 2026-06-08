import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { CreateSessionData, ISessionRepository } from "../domain/session.repository.interface";

@Injectable()
export class PrismaSessionRepository implements ISessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateSessionData): Promise<{ id: string }> {
    const s = await this.prisma.userSession.create({
      data: {
        userId: data.userId,
        tenantId: data.tenantId,
        refreshTokenHash: data.refreshTokenHash,
        expiresAt: data.expiresAt,
      },
      select: { id: true },
    });
    return { id: s.id };
  }

  findActiveByHash(hash: string): Promise<{ id: string } | null> {
    return this.prisma.userSession.findFirst({
      where: { refreshTokenHash: hash, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true },
    });
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }
}

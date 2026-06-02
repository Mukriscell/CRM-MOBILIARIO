import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { IUserRepository } from "../domain/user.repository.interface";

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(tenantId: string | null, email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email, tenantId, deletedAt: null },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { id, deletedAt: null } });
  }

  findActiveBrokers(tenantId: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { tenantId, status: "ACTIVE", role: { in: ["CORREDOR", "ADMIN"] }, deletedAt: null },
    });
  }
}

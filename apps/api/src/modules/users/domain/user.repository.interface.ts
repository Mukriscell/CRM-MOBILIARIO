import { User } from "@prisma/client";

export const USER_REPOSITORY = Symbol("USER_REPOSITORY");

export interface IUserRepository {
  findByEmail(tenantId: string | null, email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  /** Corredores activos del tenant, opcionalmente filtrados por comuna de propiedades asignadas. */
  findActiveBrokers(tenantId: string): Promise<User[]>;
}

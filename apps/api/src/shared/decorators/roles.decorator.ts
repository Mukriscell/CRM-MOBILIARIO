import { SetMetadata } from "@nestjs/common";
import { UserRole } from "@clientra/shared-types";

export const ROLES_KEY = "roles";

/** Restringe un endpoint a ciertos roles (usado con RolesGuard). */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

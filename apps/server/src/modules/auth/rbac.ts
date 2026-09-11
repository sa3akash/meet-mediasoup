import type { UserRole } from "@meet/shared-types";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  USER: 1,
  MODERATOR: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

export function hasRole(userRole: string, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole as UserRole);
}

export function hasMinimumRole(userRole: string, minRole: UserRole): boolean {
  const currentLevel = ROLE_HIERARCHY[userRole as UserRole] || 0;
  const targetLevel = ROLE_HIERARCHY[minRole] || 0;
  return currentLevel >= targetLevel;
}

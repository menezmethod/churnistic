import { Permission, UserRole, ROLE_PERMISSIONS } from '@/lib/auth';

export function hasPermission(
  userRole: UserRole | undefined,
  permission: Permission
): boolean {
  if (!userRole) return false;
  return ROLE_PERMISSIONS[userRole].includes(permission);
}

export function hasRole(
  currentRole: UserRole | undefined,
  requiredRole: UserRole
): boolean {
  if (!currentRole) return false;

  // Super Admin has access to everything
  if (currentRole === UserRole.SUPER_ADMIN) return true;

  // Admin has access to all roles
  if (currentRole === UserRole.ADMIN) {
    return [UserRole.ADMIN, UserRole.CONTRIBUTOR, UserRole.USER].includes(requiredRole);
  }

  // Contributor has access to Contributor role only
  if (currentRole === UserRole.CONTRIBUTOR) {
    return requiredRole === UserRole.CONTRIBUTOR;
  }

  // User has access to User role only
  return requiredRole === UserRole.USER;
}

export function canAccessRoute(
  userRole: UserRole | undefined,
  requiredPermissions: Permission[]
): boolean {
  if (!userRole) return false;

  // Super Admin has access to all routes
  if (userRole === UserRole.SUPER_ADMIN) return true;

  // Check if user has all required permissions
  return requiredPermissions.every((permission) => hasPermission(userRole, permission));
}

export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function isSuperAdmin(email: string | null | undefined): boolean {
  return email === 'menezfd@gmail.com';
}

export function getHighestRole(roles: UserRole[]): UserRole {
  if (roles.includes(UserRole.SUPER_ADMIN)) return UserRole.SUPER_ADMIN;
  if (roles.includes(UserRole.ADMIN)) return UserRole.ADMIN;
  return UserRole.CONTRIBUTOR;
}

export function validatePermissions(
  userRole: UserRole | undefined,
  requiredPermissions: Permission[]
): string | null {
  if (!userRole) return 'User is not authenticated';

  const missingPermissions = requiredPermissions.filter(
    (permission) => !hasPermission(userRole, permission)
  );

  if (missingPermissions.length > 0) {
    return `Missing required permissions: ${missingPermissions.join(', ')}`;
  }

  return null;
}

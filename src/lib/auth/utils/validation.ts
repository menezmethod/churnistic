import { hasPermission, hasRole } from '@/lib/auth';
import { Permission, UserRole } from '@/lib/auth';

import { AUTH_ERRORS } from '../core/constants';

export function validateEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return AUTH_ERRORS.INVALID_EMAIL;
  if (!emailRegex.test(email)) return AUTH_ERRORS.INVALID_EMAIL;
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return AUTH_ERRORS.WEAK_PASSWORD;
  if (password.length < 6) return AUTH_ERRORS.WEAK_PASSWORD;
  return null;
}

export function validateRouteAccess(
  userRole: UserRole | undefined,
  requiredRole: UserRole,
  requiredPermissions: Permission[]
): string | null {
  // Check if user is authenticated
  if (!userRole) return AUTH_ERRORS.UNAUTHORIZED;

  // Check role
  if (!hasRole(userRole, requiredRole)) {
    return AUTH_ERRORS.UNAUTHORIZED;
  }

  // Check permissions
  const missingPermissions = requiredPermissions.filter(
    (permission) => !hasPermission(userRole, permission)
  );

  if (missingPermissions.length > 0) {
    return `${AUTH_ERRORS.MISSING_PERMISSIONS}: ${missingPermissions.join(', ')}`;
  }

  return null;
}

export function validateSession(exp?: number): string | null {
  if (!exp) return AUTH_ERRORS.INVALID_TOKEN;

  const now = Math.floor(Date.now() / 1000);
  if (exp < now) return AUTH_ERRORS.SESSION_EXPIRED;

  return null;
}

export function validateToken(token: string): string | null {
  if (!token) return AUTH_ERRORS.INVALID_TOKEN;

  try {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) return AUTH_ERRORS.INVALID_TOKEN;

    // Basic structure validation
    const decodedPayload = JSON.parse(atob(payload));
    if (!decodedPayload.exp || !decodedPayload.iat) {
      return AUTH_ERRORS.INVALID_TOKEN;
    }

    // Check expiration
    return validateSession(decodedPayload.exp);
  } catch {
    return AUTH_ERRORS.INVALID_TOKEN;
  }
}

export function validateUserClaims(claims: {
  role?: UserRole;
  permissions?: Permission[];
}): string | null {
  if (!claims) return AUTH_ERRORS.INVALID_TOKEN;

  // Validate role
  if (!claims.role || !Object.values(UserRole).includes(claims.role)) {
    return AUTH_ERRORS.INVALID_TOKEN;
  }

  // Validate permissions
  if (!Array.isArray(claims.permissions)) {
    return AUTH_ERRORS.INVALID_TOKEN;
  }

  // Check if all permissions are valid
  const invalidPermissions = claims.permissions.filter(
    (p: Permission) => !Object.values(Permission).includes(p)
  );

  if (invalidPermissions.length > 0) {
    return AUTH_ERRORS.INVALID_TOKEN;
  }

  return null;
}

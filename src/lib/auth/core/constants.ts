import { Permission, UserRole } from './types';

export const AUTH_COOKIE_NAME = 'session';
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 5, // 5 days
};

export const PROTECTED_ROUTES = {
  ADMIN_DASHBOARD: {
    path: '/admin',
    requiredRole: UserRole.ADMIN,
    requiredPermissions: [Permission.MANAGE_SYSTEM],
  },
  USER_MANAGEMENT: {
    path: '/admin/users',
    requiredRole: UserRole.ADMIN,
    requiredPermissions: [Permission.MANAGE_USERS],
  },
  ANALYTICS: {
    path: '/analytics',
    requiredRole: UserRole.ADMIN,
    requiredPermissions: [Permission.VIEW_ANALYTICS],
  },
  OFFERS: {
    path: '/offers',
    requiredRole: UserRole.CONTRIBUTOR,
    requiredPermissions: [Permission.VIEW_OFFERS],
  },
  PROFILE: {
    path: '/profile',
    requiredRole: UserRole.CONTRIBUTOR,
    requiredPermissions: [Permission.VIEW_OWN_PROFILE],
  },
};

export const AUTH_ERRORS = {
  INVALID_EMAIL: 'Invalid email address',
  USER_DISABLED: 'This account has been disabled',
  USER_NOT_FOUND: 'No account found with this email',
  WRONG_PASSWORD: 'Invalid password',
  EMAIL_IN_USE: 'An account already exists with this email',
  WEAK_PASSWORD: 'Password should be at least 6 characters',
  POPUP_CLOSED: 'Sign in was cancelled',
  OPERATION_NOT_ALLOWED: 'Operation not allowed',
  NETWORK_ERROR: 'Network error. Please check your connection',
  TOO_MANY_REQUESTS: 'Too many attempts. Please try again later',
  UNAUTHORIZED: 'You are not authorized to access this resource',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again',
  INVALID_TOKEN: 'Invalid authentication token',
  MISSING_PERMISSIONS: 'You do not have the required permissions',
} as const;

export const AUTH_PROVIDERS = {
  EMAIL: 'email',
  GOOGLE: 'google',
  GITHUB: 'github',
} as const;

export const SESSION_DURATION = {
  DEFAULT: 60 * 60 * 24 * 5 * 1000, // 5 days
  REMEMBER_ME: 60 * 60 * 24 * 30 * 1000, // 30 days
  MINIMUM: 60 * 60 * 1000, // 1 hour
} as const;

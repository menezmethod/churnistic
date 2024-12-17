export enum UserRole {
  USER = 'user',
  SUPPORT = 'support',
  ADMIN = 'admin',
}

export enum Permission {
  // Card management
  READ_CARDS = 'read:cards',
  CREATE_CARDS = 'create:cards',
  UPDATE_CARDS = 'update:cards',
  DELETE_CARDS = 'delete:cards',

  // User management
  READ_USERS = 'read:users',
  UPDATE_USERS = 'update:users',
  DELETE_USERS = 'delete:users',

  // Support actions
  HANDLE_SUPPORT = 'handle:support',
  VIEW_LOGS = 'view:logs',

  // Admin actions
  MANAGE_ROLES = 'manage:roles',
  MANAGE_SETTINGS = 'manage:settings',
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    Permission.READ_CARDS,
    Permission.CREATE_CARDS,
    Permission.UPDATE_CARDS,
    Permission.DELETE_CARDS,
  ],
  [UserRole.SUPPORT]: [
    Permission.READ_CARDS,
    Permission.UPDATE_CARDS,
    Permission.READ_USERS,
    Permission.HANDLE_SUPPORT,
    Permission.VIEW_LOGS,
  ],
  [UserRole.ADMIN]: Object.values(Permission),
};

export interface UserClaims {
  role: UserRole;
  permissions: Permission[];
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  permissions: Permission[];
}

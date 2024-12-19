import type { User } from 'firebase/auth';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum Permission {
  READ_USERS = 'read:users',
  WRITE_USERS = 'write:users',
  DELETE_USERS = 'delete:users',
  READ_CARDS = 'read:cards',
}

export interface AuthUser extends User {
  role?: UserRole;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: Permission) => boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.READ_USERS,
    Permission.WRITE_USERS,
    Permission.DELETE_USERS,
    Permission.READ_CARDS,
  ],
  [UserRole.USER]: [Permission.READ_USERS, Permission.READ_CARDS],
};

export interface Session {
  uid: string;
  email: string;
  role: UserRole;
  permissions?: Permission[];
}

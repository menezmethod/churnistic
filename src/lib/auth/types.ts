import { User } from '@supabase/supabase-js';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  CONTRIBUTOR = 'contributor',
  USER = 'user',
}

export type Permission =
  | 'manage_roles'
  | 'manage_users'
  | 'manage_opportunities'
  | 'manage_system'
  | 'view_analytics'
  | 'manage_ai'
  | 'submit_opportunities'
  | 'track_opportunities';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    'manage_roles',
    'manage_users',
    'manage_opportunities',
    'manage_system',
    'view_analytics',
    'manage_ai',
  ],
  [UserRole.ADMIN]: [
    'manage_users',
    'manage_opportunities',
    'view_analytics',
    'manage_ai',
  ],
  [UserRole.CONTRIBUTOR]: ['manage_opportunities', 'manage_ai'],
  [UserRole.USER]: ['submit_opportunities', 'track_opportunities'],
};

export interface AuthUser extends User {
  role?: UserRole;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: Permission) => boolean;
  isSuperAdmin: () => boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isOnline: boolean;
}

export interface Session {
  uid: string;
  email: string;
  role: UserRole;
  permissions?: Permission[];
}

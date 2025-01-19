import type { User } from 'firebase/auth';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  CONTRIBUTOR = 'contributor',
  USER = 'user',
}

export enum Permission {
  // System Management
  MANAGE_SYSTEM = 'manage:system',
  VIEW_ANALYTICS = 'view:analytics',
  MANAGE_USERS = 'manage:users',

  // Opportunity Management
  VIEW_OPPORTUNITIES = 'view:opportunities',
  CREATE_OPPORTUNITIES = 'create:opportunities',
  EDIT_OWN_OPPORTUNITIES = 'edit:own_opportunities',
  DELETE_OWN_OPPORTUNITIES = 'delete:own_opportunities',

  // Offer Management
  VIEW_OFFERS = 'view:offers',
  CREATE_OFFERS = 'create:offers',
  EDIT_OFFERS = 'edit:offers',
  DELETE_OFFERS = 'delete:offers',

  // Profile Management
  VIEW_OWN_PROFILE = 'view:own_profile',
  EDIT_OWN_PROFILE = 'edit:own_profile',
  VIEW_OTHER_PROFILES = 'view:other_profiles',
  EDIT_OTHER_PROFILES = 'edit:other_profiles',
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    // Full access to all permissions
    ...Object.values(Permission),
  ],

  [UserRole.ADMIN]: [
    Permission.MANAGE_SYSTEM,
    Permission.VIEW_ANALYTICS,
    Permission.MANAGE_USERS,
    Permission.VIEW_OFFERS,
    Permission.CREATE_OFFERS,
    Permission.EDIT_OFFERS,
    Permission.DELETE_OFFERS,
    Permission.VIEW_OPPORTUNITIES,
    Permission.CREATE_OPPORTUNITIES,
    Permission.EDIT_OWN_OPPORTUNITIES,
    Permission.DELETE_OWN_OPPORTUNITIES,
    Permission.VIEW_OWN_PROFILE,
    Permission.EDIT_OWN_PROFILE,
    Permission.VIEW_OTHER_PROFILES,
    Permission.EDIT_OTHER_PROFILES,
  ],

  [UserRole.CONTRIBUTOR]: [
    Permission.VIEW_OPPORTUNITIES,
    Permission.CREATE_OPPORTUNITIES,
    Permission.EDIT_OWN_OPPORTUNITIES,
    Permission.DELETE_OWN_OPPORTUNITIES,
    Permission.VIEW_OWN_PROFILE,
    Permission.EDIT_OWN_PROFILE,
  ],
  [UserRole.USER]: [
    Permission.VIEW_OPPORTUNITIES,
    Permission.VIEW_OWN_PROFILE,
    Permission.EDIT_OWN_PROFILE,
  ],
};

export interface AuthUser extends User {
  role?: UserRole;
  customClaims?: {
    role?: UserRole;
    permissions?: Permission[];
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  displayName?: string;
}

export interface Session {
  uid: string;
  email: string | null;
  role: UserRole;
  permissions?: Permission[];
}

export interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: Permission) => boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isOnline: boolean;
}

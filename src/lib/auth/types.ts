import { User } from 'firebase/auth';

export enum UserRole {
  PAID_USER = 'PAID_USER',
  FREE_USER = 'FREE_USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  CONTRIBUTOR = 'CONTRIBUTOR',
}

export enum Permission {
  // Core permissions
  VIEW_OWN_PROFILE = 'VIEW_OWN_PROFILE',
  EDIT_OWN_PROFILE = 'EDIT_OWN_PROFILE',
  VIEW_OWN_SETTINGS = 'VIEW_OWN_SETTINGS',
  EDIT_OWN_SETTINGS = 'EDIT_OWN_SETTINGS',

  // Opportunities
  SUBMIT_OPPORTUNITIES = 'SUBMIT_OPPORTUNITIES',
  TRACK_OPPORTUNITIES = 'TRACK_OPPORTUNITIES',
  APPROVE_OPPORTUNITIES = 'APPROVE_OPPORTUNITIES',
  DELETE_OPPORTUNITIES = 'DELETE_OPPORTUNITIES',
  FEATURE_OPPORTUNITIES = 'FEATURE_OPPORTUNITIES',
  MANAGE_OPPORTUNITIES = 'MANAGE_OPPORTUNITIES',
  EDIT_OWN_OPPORTUNITIES = 'EDIT_OWN_OPPORTUNITIES',
  EDIT_OTHER_OPPORTUNITIES = 'EDIT_OTHER_OPPORTUNITIES',

  // User management
  VIEW_USER_PROFILES = 'VIEW_USER_PROFILES',
  EDIT_USER_PROFILES = 'EDIT_USER_PROFILES',
  MANAGE_USERS = 'MANAGE_USERS',

  // Analytics
  VIEW_BASIC_ANALYTICS = 'VIEW_BASIC_ANALYTICS',
  VIEW_ADVANCED_ANALYTICS = 'VIEW_ADVANCED_ANALYTICS',
  EXPORT_ANALYTICS = 'EXPORT_ANALYTICS',

  // System
  MANAGE_ROLES = 'MANAGE_ROLES',
  MANAGE_SYSTEM = 'MANAGE_SYSTEM',
  MANAGE_AI = 'MANAGE_AI',

  // Notifications
  RECEIVE_CREDIT_CARD_ALERTS = 'RECEIVE_CREDIT_CARD_ALERTS',
  RECEIVE_BANK_BONUS_ALERTS = 'RECEIVE_BANK_BONUS_ALERTS',
  RECEIVE_INVESTMENT_ALERTS = 'RECEIVE_INVESTMENT_ALERTS',
  RECEIVE_RISK_ALERTS = 'RECEIVE_RISK_ALERTS',

  // API
  USE_API = 'USE_API',
  MANAGE_API_KEYS = 'MANAGE_API_KEYS',
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.PAID_USER]: [Permission.SUBMIT_OPPORTUNITIES, Permission.TRACK_OPPORTUNITIES],
  [UserRole.SUPER_ADMIN]: [
    Permission.MANAGE_ROLES,
    Permission.MANAGE_USERS,
    Permission.MANAGE_OPPORTUNITIES,
    Permission.MANAGE_SYSTEM,
    Permission.VIEW_BASIC_ANALYTICS,
    Permission.VIEW_ADVANCED_ANALYTICS,
    Permission.MANAGE_AI,
    Permission.FEATURE_OPPORTUNITIES,
  ],
  [UserRole.ADMIN]: [
    Permission.MANAGE_USERS,
    Permission.MANAGE_OPPORTUNITIES,
    Permission.VIEW_BASIC_ANALYTICS,
    Permission.VIEW_ADVANCED_ANALYTICS,
    Permission.MANAGE_AI,
    Permission.FEATURE_OPPORTUNITIES,
  ],
  [UserRole.CONTRIBUTOR]: [
    Permission.MANAGE_OPPORTUNITIES,
    Permission.MANAGE_AI,
    Permission.EDIT_OTHER_OPPORTUNITIES,
  ],
  [UserRole.FREE_USER]: [Permission.VIEW_OWN_PROFILE],
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

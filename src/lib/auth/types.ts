// TODO: Migrate to Supabase types
// This file needs to be updated to use Supabase Auth types instead of Firebase Auth types
// Replace FirebaseUser with User from @supabase/supabase-js

import { User } from '@supabase/supabase-js';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum Permission {
  // Profile Management
  VIEW_OWN_PROFILE = 'view:own_profile',
  EDIT_OWN_PROFILE = 'edit:own_profile',
  VIEW_OTHER_PROFILES = 'view:other_profiles',
  EDIT_OTHER_PROFILES = 'edit:other_profiles',

  // Settings Management
  VIEW_OWN_SETTINGS = 'view:own_settings',
  EDIT_OWN_SETTINGS = 'edit:own_settings',
  VIEW_SYSTEM_SETTINGS = 'view:system_settings',
  EDIT_SYSTEM_SETTINGS = 'edit:system_settings',

  // Card Management
  READ_CARDS = 'read:cards',
  WRITE_CARDS = 'write:cards',
  DELETE_CARDS = 'delete:cards',

  // Bank Account Management
  READ_BANK_ACCOUNTS = 'read:bank_accounts',
  WRITE_BANK_ACCOUNTS = 'write:bank_accounts',
  DELETE_BANK_ACCOUNTS = 'delete:bank_accounts',

  // Investment Management
  READ_INVESTMENTS = 'read:investments',
  WRITE_INVESTMENTS = 'write:investments',
  DELETE_INVESTMENTS = 'delete:investments',

  // Analytics
  VIEW_BASIC_ANALYTICS = 'view:basic_analytics',
  VIEW_ADVANCED_ANALYTICS = 'view:advanced_analytics',
  EXPORT_ANALYTICS = 'export:analytics',

  // Risk Management
  VIEW_RISK_SCORES = 'view:risk_scores',
  MANAGE_RISK_RULES = 'manage:risk_rules',

  // User Management
  READ_USERS = 'read:users',
  WRITE_USERS = 'write:users',
  DELETE_USERS = 'delete:users',

  // System Settings
  MANAGE_SETTINGS = 'manage:settings',
  VIEW_LOGS = 'view:logs',

  // API Access
  USE_API = 'use:api',
  MANAGE_API_KEYS = 'manage:api_keys',

  // Notification Management
  MANAGE_NOTIFICATIONS = 'manage:notifications',
  RECEIVE_CREDIT_CARD_ALERTS = 'receive:credit_card_alerts',
  RECEIVE_BANK_BONUS_ALERTS = 'receive:bank_bonus_alerts',
  RECEIVE_INVESTMENT_ALERTS = 'receive:investment_alerts',
  RECEIVE_RISK_ALERTS = 'receive:risk_alerts',
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    // Full access to all permissions
    ...Object.values(Permission),
  ],

  [UserRole.ADMIN]: [
    // Card Management
    Permission.READ_CARDS,
    Permission.WRITE_CARDS,

    // Bank Account Management
    Permission.READ_BANK_ACCOUNTS,
    Permission.WRITE_BANK_ACCOUNTS,

    // Investment Management
    Permission.READ_INVESTMENTS,
    Permission.WRITE_INVESTMENTS,

    // Analytics
    Permission.VIEW_BASIC_ANALYTICS,
    Permission.VIEW_ADVANCED_ANALYTICS,
    Permission.EXPORT_ANALYTICS,

    // Risk Management
    Permission.VIEW_RISK_SCORES,
    Permission.MANAGE_RISK_RULES,

    // User Management
    Permission.READ_USERS,
    Permission.WRITE_USERS,

    // API Access
    Permission.USE_API,

    // Notification Management
    Permission.MANAGE_NOTIFICATIONS,
    Permission.RECEIVE_CREDIT_CARD_ALERTS,
    Permission.RECEIVE_BANK_BONUS_ALERTS,
    Permission.RECEIVE_INVESTMENT_ALERTS,
    Permission.RECEIVE_RISK_ALERTS,
  ],

  [UserRole.USER]: [
    // Basic operations
    Permission.READ_CARDS,
    Permission.READ_BANK_ACCOUNTS,
    Permission.READ_INVESTMENTS,

    // Basic Analytics
    Permission.VIEW_BASIC_ANALYTICS,
    Permission.VIEW_RISK_SCORES,

    // Notifications
    Permission.RECEIVE_CREDIT_CARD_ALERTS,
    Permission.RECEIVE_BANK_BONUS_ALERTS,
    Permission.RECEIVE_INVESTMENT_ALERTS,
    Permission.RECEIVE_RISK_ALERTS,
  ],
};

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  displayName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  lastSignInAt?: string;
  emailVerified: boolean;
  businessVerified: boolean;
}

export interface AuthUser extends User {
  role: UserRole;
  isSuperAdmin: boolean;
  displayName?: string;
  avatarUrl?: string;
  photoURL?: string;
  businessVerified?: boolean;
  email_confirmed_at?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isOnline: boolean;
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: Permission) => boolean;
  isSuperAdmin: () => boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
}

export interface Session {
  user: AuthUser;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  } | null;
}

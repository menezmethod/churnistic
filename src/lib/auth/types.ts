export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  ANALYST = 'analyst',
  AGENT = 'agent',
  USER = 'user',
  FREE_USER = 'free_user',
  SUPERADMIN = 'SUPERADMIN',
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
  [UserRole.SUPERADMIN]: [
    // Full access to all permissions
    ...Object.values(Permission),
  ],
  [UserRole.ADMIN]: [
    // Full access to all permissions
    ...Object.values(Permission),
  ],

  [UserRole.MANAGER]: [
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

  [UserRole.ANALYST]: [
    // Read-only access to main features
    Permission.READ_CARDS,
    Permission.READ_BANK_ACCOUNTS,
    Permission.READ_INVESTMENTS,

    // Analytics
    Permission.VIEW_BASIC_ANALYTICS,
    Permission.VIEW_ADVANCED_ANALYTICS,
    Permission.EXPORT_ANALYTICS,

    // Risk Management
    Permission.VIEW_RISK_SCORES,

    // API Access
    Permission.USE_API,

    // Notifications
    Permission.RECEIVE_CREDIT_CARD_ALERTS,
    Permission.RECEIVE_BANK_BONUS_ALERTS,
    Permission.RECEIVE_INVESTMENT_ALERTS,
    Permission.RECEIVE_RISK_ALERTS,
  ],

  [UserRole.AGENT]: [
    // Basic operations
    Permission.READ_CARDS,
    Permission.WRITE_CARDS,
    Permission.READ_BANK_ACCOUNTS,
    Permission.WRITE_BANK_ACCOUNTS,
    Permission.READ_INVESTMENTS,
    Permission.WRITE_INVESTMENTS,

    // Basic Analytics
    Permission.VIEW_BASIC_ANALYTICS,
    Permission.VIEW_RISK_SCORES,

    // Notifications
    Permission.RECEIVE_CREDIT_CARD_ALERTS,
    Permission.RECEIVE_BANK_BONUS_ALERTS,
    Permission.RECEIVE_INVESTMENT_ALERTS,
    Permission.RECEIVE_RISK_ALERTS,
  ],

  [UserRole.USER]: [
    // Standard user permissions
    Permission.READ_CARDS,
    Permission.WRITE_CARDS,
    Permission.READ_BANK_ACCOUNTS,
    Permission.WRITE_BANK_ACCOUNTS,
    Permission.READ_INVESTMENTS,
    Permission.WRITE_INVESTMENTS,
    Permission.VIEW_BASIC_ANALYTICS,
    Permission.VIEW_RISK_SCORES,
    Permission.USE_API,

    // Notifications
    Permission.RECEIVE_CREDIT_CARD_ALERTS,
    Permission.RECEIVE_BANK_BONUS_ALERTS,
    Permission.RECEIVE_INVESTMENT_ALERTS,
    Permission.RECEIVE_RISK_ALERTS,
  ],

  [UserRole.FREE_USER]: [
    // Limited permissions for free tier
    Permission.READ_CARDS,
    Permission.READ_BANK_ACCOUNTS,
    Permission.READ_INVESTMENTS,
    Permission.VIEW_BASIC_ANALYTICS,

    // Limited notifications
    Permission.RECEIVE_CREDIT_CARD_ALERTS,
    Permission.RECEIVE_BANK_BONUS_ALERTS,
  ],
};

export interface AuthUser {
  uid: string;
  email: string;
  role?: UserRole;
  isSuperAdmin?: boolean;
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

export const ADMIN_ROLES = [UserRole.ADMIN, UserRole.SUPERADMIN];

export interface AppUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  role: UserRole;
  permissions: Permission[];
  isSuperAdmin?: boolean;
}

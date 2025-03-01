import { UserRole } from '@/lib/auth/types';

export type Permission = 'read' | 'write' | 'delete' | 'manage';

export interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  permissions?: Permission[];
  isSuperAdmin?: boolean;
  status?: string;
  creditScore?: number;
  monthlyIncome?: number;
  customClaims?: {
    role: UserRole;
    permissions: Permission[];
    isSuperAdmin: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

// This interface matches the actual database schema with snake_case column names
export interface DatabaseUser {
  id: string;
  email: string;
  display_name: string | null;
  custom_display_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  status?: string;
  credit_score?: number;
  monthly_income?: number;
  is_super_admin?: boolean;
  permissions?: Permission[];
  business_verified: boolean;
  created_at: string;
  updated_at: string;
}

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

export interface UserSettings {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  pushNotifications: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface UserStats {
  totalOpportunities: number;
  approvedOpportunities: number;
  rejectedOpportunities: number;
  pendingOpportunities: number;
  lastActivityAt?: string;
}

// Helper functions to convert between database and frontend formats
export function mapDatabaseUserToUser(dbUser: DatabaseUser): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    displayName: dbUser.display_name,
    avatarUrl: dbUser.avatar_url,
    role: dbUser.role,
    isSuperAdmin: dbUser.is_super_admin,
    status: dbUser.status,
    creditScore: dbUser.credit_score,
    monthlyIncome: dbUser.monthly_income,
    permissions: dbUser.permissions,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at
  };
}

export function mapUserToDatabaseFields(user: Partial<User>): Partial<DatabaseUser> {
  const dbUser: Partial<DatabaseUser> = {};
  if (user.id !== undefined) dbUser.id = user.id;
  if (user.email !== undefined && user.email !== null) dbUser.email = user.email;
  if (user.displayName !== undefined) dbUser.display_name = user.displayName;
  if (user.avatarUrl !== undefined) dbUser.avatar_url = user.avatarUrl;
  if (user.role !== undefined) dbUser.role = user.role;
  if (user.isSuperAdmin !== undefined) dbUser.is_super_admin = user.isSuperAdmin;
  if (user.status !== undefined) dbUser.status = user.status;
  if (user.creditScore !== undefined) dbUser.credit_score = user.creditScore;
  if (user.monthlyIncome !== undefined) dbUser.monthly_income = user.monthlyIncome;
  if (user.permissions !== undefined) dbUser.permissions = user.permissions;
  if (user.createdAt !== undefined) dbUser.created_at = user.createdAt;
  if (user.updatedAt !== undefined) dbUser.updated_at = user.updatedAt;
  
  return dbUser;
}

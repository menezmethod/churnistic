import { UserRole, Permission } from '@/lib/auth/core/types';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  permissions?: Permission[];
  isSuperAdmin?: boolean;
  status?: string;
  creditScore?: number;
  monthlyIncome?: number;
  photoURL?: string | null;
  customClaims?: {
    role: UserRole;
    permissions: Permission[];
    isSuperAdmin: boolean;
  };
  isContributor?: boolean;
  contributorProfile?: {
    bio?: string;
    website?: string;
    socialLinks?: {
      twitter?: string;
      linkedin?: string;
      github?: string;
    };
  };
}

export interface DatabaseUser {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string | null;
  customDisplayName: string | null;
  photoURL: string | null;
  role: UserRole;
  status?: string;
  creditScore?: number;
  monthlyIncome?: number;
  isSuperAdmin?: boolean;
  permissions?: Permission[];
  businessVerified: boolean;
  isContributor?: boolean;
  contributorProfile?: {
    bio?: string;
    website?: string;
    socialLinks?: {
      twitter?: string;
      linkedin?: string;
      github?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  role: UserRole;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  displayName: string;
  customDisplayName: string;
  photoURL: string;
  firebaseUid: string;
  creditScore: number | null;
  monthlyIncome: number | null;
  businessVerified: boolean;
  isContributor?: boolean;
  contributorProfile?: {
    bio?: string;
    website?: string;
    socialLinks?: {
      twitter?: string;
      linkedin?: string;
      github?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
  householdId: string | null;
}

export type UserRole = 'admin' | 'user' | 'superadmin';
export type Permission = 'read' | 'write' | 'delete' | 'manage';

export interface User {
  id: string;
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
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
  createdAt: string;
  updatedAt: string;
}

export type UserProfile = {
  id: string;
  role: 'user' | 'admin';
  email: string;
  status: 'active' | 'inactive' | 'pending';
  displayName: string;
  customDisplayName: string;
  photoURL: string;
  firebaseUid: string;
  creditScore: number | null;
  monthlyIncome: number | null;
  businessVerified: boolean;
  createdAt: string;
  updatedAt: string;
  householdId: string | null;
};

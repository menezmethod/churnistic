import type { User as PrismaUser } from '@prisma/client';

export type User = PrismaUser & {
  businessVerified: boolean;
};

export type UserWithoutPassword = Omit<User, 'password'>;

export interface UserProfile {
  id: string;
  role: string;
  email: string;
  status: string;
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
  cardApplications?: {
    id: string;
    issuer: string;
    card: string;
    status: 'approved' | 'pending' | 'denied';
    appliedDate: string;
    bonus: number;
    spendRequired: number;
    spendProgress: number;
    deadline: string;
  }[];
  bankBonuses?: {
    id: string;
    bank: string;
    bonus: number;
    requirements: string;
    deadline: string;
    status: 'completed' | 'pending' | 'failed';
  }[];
}

export type UserSettings = Pick<User, 'creditScore' | 'monthlyIncome'>;

export type UserWithHousehold = User & {
  household: {
    id: string;
    name: string;
  } | null;
};

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: string;
  customDisplayName?: string;
}

export interface SessionUser extends User {
  role?: string;
  customDisplayName?: string;
  photoURL: string | null;
  displayName: string | null;
  email: string | null;
  uid: string;
}

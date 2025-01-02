export interface DatabaseUser {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string | null;
  customDisplayName: string | null;
  photoURL: string | null;
  role: string;
  status: string;
  creditScore: number | null;
  monthlyIncome: number | null;
  createdAt: string;
  updatedAt: string;
  businessVerified?: boolean;
}

export type UserWithoutPassword = DatabaseUser;

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

export type UserSettings = Pick<DatabaseUser, 'creditScore' | 'monthlyIncome'>;

export type UserWithHousehold = DatabaseUser & {
  household: {
    id: string;
    name: string;
  } | null;
};

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: string;
  customDisplayName: string | null;
}

export interface SessionUser {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: string;
  customDisplayName: string | null;
}

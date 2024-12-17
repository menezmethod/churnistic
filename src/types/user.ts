import type { User as PrismaUser } from '@prisma/client';

export type User = PrismaUser;

export type UserWithoutPassword = Omit<User, 'password'>;

export type UserProfile = Pick<User, 'id' | 'email' | 'displayName' | 'photoURL'>;

export type UserSettings = Pick<User, 'creditScore' | 'monthlyIncome'>;

export type UserWithHousehold = User & {
  household: {
    id: string;
    name: string;
  } | null;
}; 
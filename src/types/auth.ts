import { User as FirebaseUser } from 'firebase/auth';

import { UserRole } from './roles';

export { UserRole } from './roles';

export interface User extends Omit<FirebaseUser, 'customClaims'> {
  role: UserRole;
  customClaims?: {
    role?: UserRole;
    [key: string]: unknown;
  };
}

export enum Permission {
  READ_USERS = 'read:users',
  WRITE_USERS = 'write:users',
  READ_OPPORTUNITIES = 'read:opportunities',
  WRITE_OPPORTUNITIES = 'write:opportunities',
}

export interface CustomClaims {
  role?: UserRole;
  permissions?: Permission[];
}

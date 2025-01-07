import { UserRole } from './roles';

export interface Session {
  uid: string;
  email: string | null;
  name?: string | null;
  role: UserRole;
  isSuperAdmin?: boolean;
  permissions?: string[];
}

export type SessionData = Session; 
import { User as SupabaseUser } from '@supabase/supabase-js';

import { UserRole } from './roles';

export { UserRole } from './roles';

export interface User extends Omit<SupabaseUser, 'user_metadata'> {
  role: UserRole;
  user_metadata?: {
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

export interface UserMetadata {
  role?: UserRole;
  permissions?: Permission[];
}

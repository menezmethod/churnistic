import { User as SupabaseUser } from '@supabase/supabase-js';

import { UserRole } from './roles';

export { UserRole } from './roles';

export type AuthUser = SupabaseUser & {
  displayName?: string;
  customDisplayName?: string;
  photoURL?: string;
  role?: UserRole;
  metadata?: {
    lastSignInTime?: string;
    creationTime?: string;
    [key: string]: unknown;
  };
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    role?: UserRole;
    [key: string]: unknown;
  };
};

export type AuthError = {
  message: string;
  code?: string;
  status?: number;
};

export type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  error: AuthError | null;
};

export type Permission =
  | 'manage_roles'
  | 'manage_users'
  | 'manage_opportunities'
  | 'manage_system'
  | 'view_analytics'
  | 'manage_ai'
  | 'submit_opportunities'
  | 'track_opportunities';

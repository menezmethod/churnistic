import { createServerClient } from '@supabase/ssr';
import { type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

import type { UserRole } from './types';
import { AuthError } from '../errors/auth';

// Create a Supabase client for server-side operations
const createServerSupabaseClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set(name, value, options);
          } catch (error) {
            console.error('Error setting cookie:', error);
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.delete({ name, ...options });
          } catch (error) {
            console.error('Error removing cookie:', error);
          }
        },
      },
    }
  );
};

export async function verifySession() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Failed to verify session:', error);
    throw new AuthError('auth/invalid-session', 'Invalid session', error);
  }
}

export async function createAuthContext() {
  try {
    const session = await verifySession();
    return { session };
  } catch (error) {
    console.error('Error creating auth context:', error);
    return { session: null };
  }
}

// Helper function to get user role and permissions
export async function getUserRoleAndPermissions(userId: string) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('user_roles')
      .select('role, permissions')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Failed to get user role:', error);
      return { role: 'user' as UserRole, permissions: [] };
    }

    return {
      role: data.role as UserRole,
      permissions: data.permissions || [],
    };
  } catch (error) {
    console.error('Error getting user role and permissions:', error);
    return { role: 'user' as UserRole, permissions: [] };
  }
}

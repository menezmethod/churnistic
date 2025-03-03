'use client';

import { UserRole, type AuthUser } from '@/lib/auth/types';
import { supabase } from '@/lib/supabase/client';

export type { AuthUser };

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  displayName?: string;
}

// Get the currently logged-in user
export const loadUser = async (): Promise<AuthUser | null> => {
  try {
    console.log('[AuthService] Loading user...');

    // Use @supabase/ssr client to get the current user - using getUser() for security
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error('[AuthService] Error getting user:', error);
      throw error;
    }

    if (!user) {
      console.log('[AuthService] No user found');
      return null;
    }

    console.log('[AuthService] User found, ID:', user.id);

    // Fetch user profile from database to get role - use eq for UUID compatibility
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('[AuthService] Error fetching user profile:', profileError);

      // If there was an error fetching the profile, try to create it
      console.log('[AuthService] Attempting to create user profile...');
      const { data: newProfile, error: insertError } = await supabase
        .from('users')
        .upsert(
          [
            {
              id: user.id,
              email: user.email,
              role: UserRole.USER,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          {
            onConflict: 'id',
            ignoreDuplicates: false,
          }
        )
        .select('role')
        .maybeSingle();

      if (insertError) {
        console.error('[AuthService] Error creating user profile:', insertError);
        // Continue with default role
      } else if (newProfile) {
        console.log('[AuthService] Created new user profile with role:', newProfile.role);
        const authUser = user as AuthUser;
        authUser.role = (newProfile.role || UserRole.USER) as UserRole;
        authUser.isSuperAdmin = isSuperAdmin(authUser);

        console.log('[AuthService] User profile created:', {
          email: authUser.email,
          role: authUser.role,
          isSuperAdmin: authUser.isSuperAdmin,
        });

        return authUser;
      }
    }

    const authUser = user as AuthUser;
    authUser.role = (userProfile?.role || UserRole.USER) as UserRole;
    authUser.isSuperAdmin = isSuperAdmin(authUser);

    console.log('[AuthService] User profile loaded:', {
      email: authUser.email,
      role: authUser.role,
      isSuperAdmin: authUser.isSuperAdmin,
    });

    return authUser;
  } catch (error) {
    console.error('[AuthService] Error loading user:', error);
    return null;
  }
};

// Login with email/password
export const loginWithEmail = async (
  credentials: LoginCredentials
): Promise<AuthUser> => {
  console.log('[AuthService] Logging in with email...');

  try {
    // Use @supabase/ssr client for authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      console.error('[AuthService] Login error:', error);
      throw error;
    }

    if (!data.user) {
      console.error('[AuthService] No user returned from login');
      throw new Error('No user returned from login');
    }

    console.log('[AuthService] Login successful, fetching user profile');

    // Use eq for UUID compatibility
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        '[AuthService] Error fetching user profile after login:',
        profileError
      );

      // If profile doesn't exist, create one
      console.log('[AuthService] Creating user profile after login');
      const { data: newProfile, error: insertError } = await supabase
        .from('users')
        .upsert(
          [
            {
              id: data.user.id,
              email: data.user.email,
              role: UserRole.USER,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
          {
            onConflict: 'id',
            ignoreDuplicates: false,
          }
        )
        .select('role')
        .maybeSingle();

      if (insertError) {
        console.error(
          '[AuthService] Error creating user profile after login:',
          insertError
        );
        // Continue with default role
      } else if (newProfile) {
        const authUser = data.user as AuthUser;
        authUser.role = (newProfile.role || UserRole.USER) as UserRole;
        authUser.isSuperAdmin = isSuperAdmin(authUser);

        console.log('[AuthService] Created user profile after login:', {
          email: authUser.email,
          role: authUser.role,
        });

        return authUser;
      }
    }

    const authUser = data.user as AuthUser;
    authUser.role = (userProfile?.role || UserRole.USER) as UserRole;
    authUser.isSuperAdmin = isSuperAdmin(authUser);

    console.log('[AuthService] User profile loaded after login:', {
      email: authUser.email,
      role: authUser.role,
    });

    return authUser;
  } catch (error) {
    console.error('[AuthService] Error in loginWithEmail:', error);
    throw error;
  }
};

// Register with email/password
export const registerWithEmail = async (
  credentials: RegisterCredentials
): Promise<AuthUser> => {
  console.log('[AuthService] Registering new user...');

  try {
    // Use @supabase/ssr client for registration
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          displayName: credentials.displayName || credentials.email.split('@')[0],
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('[AuthService] Registration error:', error);
      throw error;
    }

    if (!data.user) {
      console.error('[AuthService] No user returned from registration');
      throw new Error('No user returned from registration');
    }

    console.log('[AuthService] Registration successful, creating user profile');

    // Create user profile with upsert instead of insert for better error handling
    const { error: profileError } = await supabase.from('users').upsert(
      [
        {
          id: data.user.id,
          email: data.user.email,
          role: UserRole.USER,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          display_name: credentials.displayName || data.user.email?.split('@')[0],
        },
      ],
      {
        onConflict: 'id',
        ignoreDuplicates: false,
      }
    );

    if (profileError) {
      console.error('[AuthService] Error creating user profile:', profileError);
      throw profileError;
    }

    const authUser = data.user as AuthUser;
    authUser.role = UserRole.USER;
    authUser.isSuperAdmin = isSuperAdmin(authUser);

    console.log('[AuthService] User profile created:', {
      id: authUser.id,
      email: authUser.email,
      role: authUser.role,
    });

    return authUser;
  } catch (error) {
    console.error('[AuthService] Error in registerWithEmail:', error);
    throw error;
  }
};

// Login with Google
export const loginWithGoogle = async (): Promise<void> => {
  console.log('[AuthService] Initiating Google login...');

  try {
    // Use @supabase/ssr client for OAuth
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('[AuthService] Google login error:', error);
      throw error;
    }

    console.log('[AuthService] Google login initiated, URL:', data.url);
  } catch (error) {
    console.error('[AuthService] Error in loginWithGoogle:', error);
    throw error;
  }
};

// Login with GitHub
export const loginWithGithub = async (): Promise<void> => {
  console.log('[AuthService] Initiating GitHub login...');

  try {
    // Use @supabase/ssr client for OAuth
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('[AuthService] GitHub login error:', error);
      throw error;
    }

    console.log('[AuthService] GitHub login initiated, URL:', data.url);
  } catch (error) {
    console.error('[AuthService] Error in loginWithGithub:', error);
    throw error;
  }
};

// Reset password
export const resetPassword = async (email: string): Promise<void> => {
  console.log('[AuthService] Initiating password reset...');

  try {
    // Use @supabase/ssr client for password reset
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      console.error('[AuthService] Password reset error:', error);
      throw error;
    }

    console.log('[AuthService] Password reset email sent');
  } catch (error) {
    console.error('[AuthService] Error in resetPassword:', error);
    throw error;
  }
};

// Check if user is a super admin
export const isSuperAdmin = (user: AuthUser | null): boolean => {
  if (!user) {
    console.log('[authService] isSuperAdmin check: No user provided');
    return false;
  }

  // Handle case where role might be undefined
  if (user.role === undefined || user.role === null) {
    console.warn('[authService] isSuperAdmin check: User has no role property', user.id);
    return false;
  }

  // Convert both to lowercase strings for comparison to handle any format differences
  const userRoleStr = String(user.role).toLowerCase();
  const superAdminRoleStr = String(UserRole.SUPER_ADMIN).toLowerCase();

  // Add detailed logging to diagnose role comparison issues
  console.log('[authService] isSuperAdmin check details:', {
    userRoleType: typeof user.role,
    userRoleValue: user.role,
    userRoleStr: userRoleStr,
    superAdminRoleStr: superAdminRoleStr,
    isMatch: userRoleStr === superAdminRoleStr,
  });

  return userRoleStr === superAdminRoleStr;
};

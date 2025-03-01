'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { UserRole, type AuthUser } from '@/lib/auth/types';
import { supabase } from '@/lib/supabase/client';

// Hook to get the current user
export function useUser() {
  const queryClient = useQueryClient();
  
  // Safely check for browser environment
  const isBrowser = typeof window !== 'undefined';
  
  console.log('🔍 [useUser] Hook called', {
    timestamp: isBrowser ? new Date().toISOString() : 'server-render',
    hasExistingData: !!queryClient.getQueryData(['authenticated-user']),
    queryState: queryClient.getQueryState(['authenticated-user'])?.status || 'unknown',
  });
  
  return useQuery<AuthUser | null>({
    queryKey: ['authenticated-user'],
    // Use initialData for hydration, derived from an external source if available
    initialData: () => {
      // Only check session storage on the client side
      if (isBrowser) {
        try {
          const cachedUser = sessionStorage.getItem('cached_user');
          if (cachedUser) {
            const parsedUser = JSON.parse(cachedUser);
            const cacheTime = sessionStorage.getItem('cached_user_time');
            const isCacheStale = cacheTime && (Date.now() - parseInt(cacheTime, 10)) > 5 * 60 * 1000; // 5 min
            
            console.log('🔍 [useUser] Using cached user data for initial render', {
              id: parsedUser.id,
              email: parsedUser.email,
              stale: isCacheStale ? 'yes (will refresh in background)' : 'no',
              cacheAge: cacheTime ? `${Math.round((Date.now() - parseInt(cacheTime, 10))/1000)}s old` : 'unknown',
              timestamp: new Date().toISOString()
            });
            
            // Even if cache is stale, use it for initial render and refresh in background
            return parsedUser;
          }
        } catch (e) {
          console.warn('🔍 [useUser] Error reading cached user', e);
        }
      }
      
      console.log('🔍 [useUser] No cached user data available', {
        timestamp: isBrowser ? new Date().toISOString() : 'server-render'
      });
      
      return undefined;
    },
    staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Cache garbage collection time
    queryFn: async (): Promise<AuthUser | null> => {
      console.log('🔍 [useUser] Query function executing', {
        timestamp: new Date().toISOString(),
        execTime: isBrowser ? performance.now() : 0
      });
      
      try {
        // Get the current user from Supabase
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
          console.error('[useUser] Error getting user:', error);
          return null;
        }

        if (!user) {
          console.log('[useUser] No authenticated user found');
          // Clear any existing cached user when we know user is not authenticated
          try {
            sessionStorage.removeItem('cached_user');
            sessionStorage.removeItem('cached_user_time');
          } catch (e) {
            console.warn('[useUser] Unable to clear cached user data', e);
          }
          return null;
        }

        console.log('[useUser] User found, fetching profile data for:', user.id, {
          email: user.email,
          lastSignIn: user.last_sign_in_at,
          createdAt: user.created_at,
          timestamp: new Date().toISOString()
        });

        // Get user profile data with role
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('role, display_name, avatar_url, business_verified')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('[useUser] Error getting user profile:', profileError);
          
          // If profile doesn't exist, create one with default role
          console.log('[useUser] Attempting to create user profile');
          const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .upsert([
              {
                id: user.id,
                email: user.email,
                role: 'user', // Use string rather than enum for storage
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            ])
            .select('role, display_name, avatar_url, business_verified')
            .single();
            
          if (insertError) {
            console.error('[useUser] Error creating user profile:', insertError);
            // Create a minimal profile to avoid null values
            const authUser: AuthUser = {
              ...user,
              role: 'user' as UserRole,
              isSuperAdmin: false,
              displayName: user.email?.split('@')[0] || 'User',
              photoURL: user.user_metadata?.avatar_url || null,
              avatarUrl: user.user_metadata?.avatar_url || null,
              businessVerified: false
            };
            
            // Handle the super admin case (by email or role)
            const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
            if (user.email && superAdminEmail && user.email.toLowerCase() === superAdminEmail.toLowerCase()) {
              authUser.isSuperAdmin = true;
            }
            
            console.log('[useUser] Returning minimal user profile:', {
              id: authUser.id,
              email: authUser.email,
              role: authUser.role,
              isSuperAdmin: authUser.isSuperAdmin,
              timestamp: new Date().toISOString()
            });
            
            // Cache user with timestamp for quick initial data on future loads
            try {
              sessionStorage.setItem('cached_user', JSON.stringify(authUser));
              sessionStorage.setItem('cached_user_time', Date.now().toString());
            } catch (e) {
              console.warn('[useUser] Unable to cache user data', e);
            }
            
            return authUser;
          }
          
          // Note: Explicitly construct AuthUser object rather than casting
          const authUser: AuthUser = {
            ...user,
            role: (newProfile.role || 'user') as UserRole,
            isSuperAdmin: false,
            displayName: newProfile.display_name || user.email?.split('@')[0] || 'User',
            photoURL: newProfile.avatar_url || user.user_metadata?.avatar_url || null,
            avatarUrl: newProfile.avatar_url || null,
            businessVerified: newProfile.business_verified || false
          };
          
          // Handle the super admin case (by email or role)
          const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
          if (user.email && superAdminEmail && user.email.toLowerCase() === superAdminEmail.toLowerCase()) {
            authUser.isSuperAdmin = true;
          } else if (authUser.role === 'super_admin' as UserRole) {
            authUser.isSuperAdmin = true;
          }
          
          console.log('[useUser] Created and returning new user profile:', {
            id: authUser.id,
            email: authUser.email,
            role: authUser.role,
            isSuperAdmin: authUser.isSuperAdmin,
            timestamp: new Date().toISOString()
          });
          
          // Cache user with timestamp for quick initial data on future loads
          try {
            sessionStorage.setItem('cached_user', JSON.stringify(authUser));
            sessionStorage.setItem('cached_user_time', Date.now().toString());
          } catch (e) {
            console.warn('[useUser] Unable to cache user data', e);
          }
          
          return authUser;
        }

        // Combine auth user with profile data
        const authUser: AuthUser = {
          ...user,
          role: (userProfile?.role || 'user') as UserRole,
          isSuperAdmin: false,
          displayName: userProfile?.display_name || user.email?.split('@')[0] || 'User',
          photoURL: userProfile?.avatar_url || user.user_metadata?.avatar_url || null,
          avatarUrl: userProfile?.avatar_url || null,
          businessVerified: userProfile?.business_verified || false
        };
        
        // Handle the super admin case (by email or role)
        const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;
        if (user.email && superAdminEmail && user.email.toLowerCase() === superAdminEmail.toLowerCase()) {
          authUser.isSuperAdmin = true;
        } else if (authUser.role === 'super_admin' as UserRole) {
          authUser.isSuperAdmin = true;
        }

        console.log('[useUser] Returning authenticated user:', {
          id: authUser.id,
          email: authUser.email,
          role: authUser.role,
          isSuperAdmin: authUser.isSuperAdmin,
          timestamp: new Date().toISOString(),
          queryComplete: true
        });

        // Cache user with timestamp for quick initial data on future loads
        try {
          sessionStorage.setItem('cached_user', JSON.stringify(authUser));
          sessionStorage.setItem('cached_user_time', Date.now().toString());
        } catch (e) {
          console.warn('[useUser] Unable to cache user data', e);
        }

        return authUser;
      } catch (error) {
        console.error('🔍 [useUser] Query function error', error);
        return null; // Return null instead of throwing to avoid retries for auth errors
      }
    },
    // React Query v5 specific settings
    retry: false, // Don't retry auth failures
    refetchInterval: false, // Don't poll
    // Keep track of previous data while loading new data
    placeholderData: (prev) => prev,
    // These help with background updates
    refetchOnWindowFocus: true, 
    refetchOnReconnect: true,
    // Setup listeners for auth state changes
    refetchOnMount: true,
    // Helps debugging
    meta: {
      source: 'supabase-auth'
    }
  });
}

// Hook for login functionality
export const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      try {
        // Use @supabase/ssr client for authentication
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error) {
          console.error('Login error:', error);
          throw error;
        }

        return data.user;
      } catch (error) {
        console.error('Error in login mutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate the user query to refetch user data
      queryClient.invalidateQueries({ queryKey: ['authenticated-user'] });
      router.push('/dashboard');
    },
  });
};

// Hook for registration functionality
export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string; displayName?: string }) => {
      try {
        // Use @supabase/ssr client for registration
        const { data, error } = await supabase.auth.signUp({
          email: credentials.email,
          password: credentials.password,
          options: {
            data: {
              display_name: credentials.displayName || credentials.email.split('@')[0],
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) {
          console.error('Registration error:', error);
          throw error;
        }

        // Create user profile
        if (data.user) {
          const { error: profileError } = await supabase
            .from('users')
            .upsert([
              {
                id: data.user.id,
                email: data.user.email,
                role: UserRole.USER,
                display_name: credentials.displayName || data.user.email?.split('@')[0],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ]);

          if (profileError) {
            console.error('Error creating user profile:', profileError);
          }
        }

        return data.user;
      } catch (error) {
        console.error('Error in registration mutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate the user query to refetch user data
      queryClient.invalidateQueries({ queryKey: ['authenticated-user'] });
    },
  });
};

// Hook for logout functionality
export const useLogout = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      // Clear the React Query cache on logout
      queryClient.clear();
      
      // Clear session storage
      try {
        sessionStorage.removeItem('cached_user');
        sessionStorage.removeItem('cached_user_time');
      } catch (e) {
        console.warn('[useLogout] Error clearing session storage:', e);
      }
      
      // Redirect to login
      router.push('/auth/signin');
    },
  });
};

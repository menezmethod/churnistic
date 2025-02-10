import { User } from '@supabase/supabase-js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { generateCodeVerifier } from '@supabase/ssr'

import { UserRole } from '@/lib/auth/types';
import { supabase } from '@/lib/supabase/client';

interface UserState {
  user: User | null;
  email?: string;
  role?: UserRole;
  isAdmin: boolean;
}

const createUserRole = async (userId: string, email: string) => {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      const response = await fetch('/api/auth/role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, email }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.code === '23503') { // Foreign key violation
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between retries
          continue;
        }
        console.error('Error creating role:', error);
        return null;
      }

      const data = await response.json();
      return data.role;
    } catch (err) {
      console.error('Error in createUserRole:', err);
      return null;
    }
  }
  return null;
};

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Query for user session and data
  const { data: authData, isLoading } = useQuery<UserState>({
    queryKey: ['auth'],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return { user: null, isAdmin: false };

      // Get user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      // If no role or error, create default role with retries
      if (!roleData || roleError) {
        const role = await createUserRole(session.user.id, session.user.email || '');
        if (role) {
          return {
            user: session.user,
            email: session.user.email,
            role,
            isAdmin: ['admin', 'super_admin'].includes(role),
          };
        }
      }

      const role = roleData?.role || 'user';
      const isAdmin = ['admin', 'super_admin'].includes(role);

      return {
        user: session.user,
        email: session.user.email,
        role,
        isAdmin,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
    retryDelay: 1000,
  });

  // Set up auth state listener
  useQuery({
    queryKey: ['auth-listener'],
    queryFn: async () => {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          try {
            // Get user role
            const { data: roleData, error: roleError } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', session.user.id)
              .maybeSingle();

            // If no role or error, create default role with retries
            if (!roleData || roleError) {
              const role = await createUserRole(session.user.id, session.user.email || '');
              if (role) {
                queryClient.setQueryData(['auth'], {
                  user: session.user,
                  email: session.user.email,
                  role,
                  isAdmin: ['admin', 'super_admin'].includes(role),
                });
                return;
              }
            }

            const role = roleData?.role || 'user';
            const isAdmin = ['admin', 'super_admin'].includes(role);

            queryClient.setQueryData(['auth'], {
              user: session.user,
              email: session.user.email,
              role,
              isAdmin,
            });
          } catch (error) {
            console.error('Error fetching user role:', error);
            queryClient.setQueryData(['auth'], {
              user: session.user,
              email: session.user.email,
              isAdmin: false,
            });
          }
        } else {
          queryClient.setQueryData(['auth'], { user: null, isAdmin: false });
        }
      });
      return subscription;
    },
    gcTime: 0,
  });

  // Helper functions for role checking
  const hasRole = (checkRole: UserRole) => authData?.role === checkRole;
  const isSuperAdmin = () => authData?.role === UserRole.SUPER_ADMIN;

  // Sign in mutation
  const signInMutation = useMutation({
    mutationFn: async (
      credentials: { email: string; password: string } | { provider: string }
    ) => {
      if ('provider' in credentials) {
        const codeVerifier = generateCodeVerifier()
        localStorage.setItem('code_verifier', codeVerifier)
        
        const { data: oauthData } = await supabase.auth.signInWithOAuth({
          provider: credentials.provider as 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
            scopes: 'email profile',
            codeVerifier
          },
        });
        return oauthData;
      } else {
        const { data, error } = await supabase.auth.signInWithPassword(credentials);
        if (error) throw error;
        return data;
      }
    },
    onError: (error) => {
      console.error('Sign in error:', error);
      queryClient.setQueryData(['auth'], { user: null, isAdmin: false });
    },
  });

  // Sign up mutation
  const signUpMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  // Sign out mutation
  const signOutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth'], { user: null, isAdmin: false });
      router.push('/auth/signin');
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
      });
      if (error) throw error;
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  return {
    user: authData?.user ?? null,
    email: authData?.email,
    role: authData?.role,
    isAdmin: authData?.isAdmin ?? false,
    loading: isLoading,
    hasRole,
    isSuperAdmin,
    signIn: signInMutation.mutateAsync,
    signUp: signUpMutation.mutateAsync,
    signOut: signOutMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    updatePassword: updatePasswordMutation.mutateAsync,
  };
}

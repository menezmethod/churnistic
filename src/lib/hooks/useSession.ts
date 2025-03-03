'use client';

import { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase/client';
import { User } from '@/types/user';

export function useSession() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      console.log('[useSession] Starting session check');

      try {
        // Get user directly from Supabase client using @supabase/ssr
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        console.log('[useSession] Auth user result:', {
          exists: !!user,
          id: user?.id,
          email: user?.email,
          error: error?.message,
        });

        if (error) {
          console.error('[useSession] Error getting user:', error);
          setUser(null);
          setIsAuthenticated(false);
          return;
        }

        if (user) {
          // Get user profile data
          console.log('[useSession] Fetching user profile data for ID:', user.id);
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

          console.log('[useSession] User profile result:', {
            exists: !!userData,
            data: userData
              ? {
                  id: userData.id,
                  email: userData.email,
                  role: userData.role,
                  display_name: userData.display_name,
                }
              : null,
            error: userError?.message,
          });

          if (userError) {
            console.error('[useSession] Error getting user data:', userError);

            // If profile doesn't exist, create one with default values
            console.log('[useSession] Attempting to create user profile');
            const { data: newProfile, error: createError } = await supabase
              .from('users')
              .upsert([
                {
                  id: user.id,
                  email: user.email,
                  role: 'user',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
              ])
              .select('*')
              .single();

            console.log('[useSession] Profile creation result:', {
              success: !!newProfile,
              data: newProfile
                ? {
                    id: newProfile.id,
                    email: newProfile.email,
                    role: newProfile.role,
                  }
                : null,
              error: createError?.message,
            });

            if (createError) {
              console.error('[useSession] Error creating user profile:', createError);
            } else if (newProfile) {
              // Combine auth user with new profile data
              const fullUser = {
                ...user,
                ...newProfile,
              };

              console.log('[useSession] Setting user with new profile:', {
                id: fullUser.id,
                email: fullUser.email,
                role: fullUser.role,
                display_name: fullUser.display_name,
              });

              setUser(fullUser as User);
              setIsAuthenticated(true);
              setIsLoading(false);
              return;
            }
          }

          // Combine auth user with profile data
          const fullUser = {
            ...user,
            ...userData,
          };

          console.log('[useSession] Setting user with existing profile:', {
            id: fullUser.id,
            email: fullUser.email,
            role: fullUser.role,
            display_name: fullUser.display_name,
          });

          setUser(fullUser as User);
          setIsAuthenticated(true);
        } else {
          console.log('[useSession] No authenticated user found');
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('[useSession] Session check failed:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
        console.log(
          '[useSession] Session check completed, isAuthenticated:',
          isAuthenticated
        );
      }
    };

    // Set up auth state listener using @supabase/ssr
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        console.log(
          '[useSession] Auth state changed:',
          event,
          'Session exists:',
          !!session
        );

        if (session) {
          try {
            // Get user profile data on auth state change
            console.log(
              '[useSession] Fetching user profile on auth change for ID:',
              session.user.id
            );
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            console.log('[useSession] User profile on auth change result:', {
              exists: !!userData,
              data: userData
                ? {
                    id: userData.id,
                    email: userData.email,
                    role: userData.role,
                    display_name: userData.display_name,
                  }
                : null,
              error: userError?.message,
            });

            if (userError) {
              console.error(
                '[useSession] Error getting user data on auth change:',
                userError
              );

              // If profile doesn't exist, create one with default values
              console.log(
                '[useSession] Attempting to create user profile on auth change'
              );
              const { data: newProfile, error: createError } = await supabase
                .from('users')
                .upsert([
                  {
                    id: session.user.id,
                    email: session.user.email,
                    role: 'user',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                ])
                .select('*')
                .single();

              console.log('[useSession] Profile creation on auth change result:', {
                success: !!newProfile,
                data: newProfile
                  ? {
                      id: newProfile.id,
                      email: newProfile.email,
                      role: newProfile.role,
                    }
                  : null,
                error: createError?.message,
              });

              if (createError) {
                console.error(
                  '[useSession] Error creating user profile on auth change:',
                  createError
                );
              } else if (newProfile) {
                // Combine auth user with new profile data
                const fullUser = {
                  ...session.user,
                  ...newProfile,
                };

                console.log(
                  '[useSession] Setting user with new profile on auth change:',
                  {
                    id: fullUser.id,
                    email: fullUser.email,
                    role: fullUser.role,
                    display_name: fullUser.display_name,
                  }
                );

                setUser(fullUser as User);
                setIsAuthenticated(true);
                setIsLoading(false);
                return;
              }
            }

            // Combine auth user with profile data
            const fullUser = {
              ...session.user,
              ...userData,
            };

            console.log(
              '[useSession] Setting user with existing profile on auth change:',
              {
                id: fullUser.id,
                email: fullUser.email,
                role: fullUser.role,
                display_name: fullUser.display_name,
              }
            );

            setUser(fullUser as User);
            setIsAuthenticated(true);
          } catch (error) {
            console.error('[useSession] Error processing auth state change:', error);
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          console.log('[useSession] No session in auth state change');
          setUser(null);
          setIsAuthenticated(false);
        }
        setIsLoading(false);
      }
    );

    // Initial session check
    void checkSession();

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [isAuthenticated]); // Added isAuthenticated to the dependency array

  return { isLoading, isAuthenticated, user };
}

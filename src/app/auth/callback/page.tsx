'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { supabase } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Log all available search params for debugging
      console.log(
        '[Auth Callback] Search params:',
        Object.fromEntries([...searchParams.entries()])
      );

      const code = searchParams.get('code');
      const next = searchParams.get('next') ?? '/dashboard';
      const error = searchParams.get('error');
      const error_description = searchParams.get('error_description');

      // Debug localStorage for better PKCE debugging
      if (typeof window !== 'undefined') {
        try {
          // Log all localStorage keys and their values for debugging
          const allStorageKeys = Object.keys(localStorage);
          console.log('[Auth Callback] All localStorage keys:', allStorageKeys);

          // Check specifically for PKCE related keys
          const supabaseKeys = allStorageKeys.filter(
            (key) =>
              key.includes('supabase') ||
              key.includes('sb-') ||
              key.includes('code_verifier')
          );

          console.log('[Auth Callback] Supabase localStorage keys:', supabaseKeys);

          // Log specific PKCE data
          supabaseKeys.forEach((key) => {
            if (key.includes('code_verifier') || key.includes('pkce')) {
              console.log(
                `[Auth Callback] PKCE key found: ${key}, value exists: ${!!localStorage.getItem(key)}`
              );
            }
          });
        } catch (storageError) {
          console.error('[Auth Callback] Error accessing localStorage:', storageError);
        }
      }

      if (error) {
        console.error('[Auth Callback] Auth error:', error, error_description);
        router.push(
          `/auth/error?error=${encodeURIComponent(error_description || error)}`
        );
        return;
      }

      if (!code) {
        console.error('[Auth Callback] No code in URL');
        router.push('/auth/error?error=No authorization code found');
        return;
      }

      try {
        console.log('[Auth Callback] Attempting to exchange code for session');

        // Exchange the code for a session - this will validate the code_verifier automatically
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error('[Auth Callback] Exchange error:', error);

          // Check if it's a PKCE verification error
          if (
            error.message?.includes('code verifier') ||
            error.message?.includes('pkce')
          ) {
            console.error(
              '[Auth Callback] PKCE verification failed. Attempting fallback...'
            );

            // Try to get existing session as fallback
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData.session) {
              console.log('[Auth Callback] Existing session found, proceeding with it.');
              router.push(next);
              return;
            }

            // If no session available, redirect to error page with specific message
            router.push(
              '/auth/error?error=Authentication verification failed. Please try logging in again.'
            );
            return;
          }

          throw error;
        }

        console.log('[Auth Callback] Code exchange successful:', !!data);

        // Get the updated session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log('[Auth Callback] Session retrieved:', {
          hasSession: !!session,
          userId: session?.user?.id,
        });

        // Redirect to intended destination
        router.push(next);
      } catch (error) {
        console.error('[Auth Callback] Error in auth callback:', error);

        // Try to get more detailed error information
        let errorMessage = 'Authentication failed';
        if (error instanceof Error) {
          errorMessage = error.message;
        }

        // Check if we can still get a session despite the error
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            console.log('[Auth Callback] Found session despite error, proceeding');
            router.push(next);
            return;
          }
        } catch (sessionError) {
          console.error(
            '[Auth Callback] Failed to get session after error:',
            sessionError
          );
        }

        router.push(`/auth/error?error=${encodeURIComponent(errorMessage)}`);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Completing sign in...</h1>
        <div className="animate-pulse">Please wait while we complete your sign in.</div>
      </div>
    </div>
  );
}

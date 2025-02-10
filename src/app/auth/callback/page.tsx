'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { cookies } from 'next/headers'

import { supabase } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const error_description = searchParams.get('error_description');

        console.log('Auth callback params:', { code, error, error_description });

        if (error) {
          console.error('OAuth error:', error, error_description);
          toast.error(error_description || 'Authentication failed');
          router.push(`/auth/signin?error=${error}&error_description=${error_description}`);
          return;
        }

        if (!code) {
          console.error('No code in callback');
          toast.error('Authentication code missing');
          router.push('/auth/signin?error=no_code');
          return;
        }

        // Exchange the code for a session
        console.log('Exchanging code for session...');
        const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code, {
          codeVerifier: localStorage.getItem('code_verifier')
        });
        if (sessionError) {
          console.error('Session exchange error:', sessionError);
          toast.error('Failed to complete authentication');
          router.push('/auth/signin?error=session_exchange');
          return;
        }

        if (!data.session) {
          console.error('No session after exchange');
          toast.error('Failed to create session');
          router.push('/auth/signin?error=no_session');
          return;
        }

        console.log('Session created successfully:', data.session.user.id);

        // Get the redirect URL from localStorage or default to dashboard
        const redirectTo = localStorage.getItem('redirectTo') || '/dashboard';
        console.log('Redirecting to:', redirectTo);
        
        // Wait for the auth state to be updated
        await new Promise((resolve) => {
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user.id === data.session?.user.id) {
              subscription.unsubscribe();
              resolve(undefined);
            }
          });

          // Timeout after 5 seconds
          setTimeout(() => {
            subscription.unsubscribe();
            resolve(undefined);
          }, 5000);
        });

        toast.success('Successfully signed in!');
        router.push(redirectTo);

        // Remove the code verifier from localStorage
        localStorage.removeItem('code_verifier');
      } catch (err) {
        console.error('Callback error:', err);
        toast.error('An unexpected error occurred');
        router.push('/auth/signin?error=callback_error');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Completing sign in...</h2>
      <p>Please wait while we complete your sign in.</p>
    </div>
  );
}

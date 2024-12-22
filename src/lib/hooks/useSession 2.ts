import { getAuth, onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export interface SessionUser {
  uid: string;
  email: string | null;
  role: string;
  displayName: string | null;
  photoURL: string | null;
}

export interface SessionState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: SessionUser | null;
}

export function useSession() {
  const [session, setSession] = useState<SessionState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
  });

  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get the ID token with force refresh to ensure it's up to date
          const idTokenResult = await getIdTokenResult(firebaseUser, true);

          // Create or refresh the session cookie
          const response = await fetch('/api/auth/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              idToken: await firebaseUser.getIdToken(),
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to create session');
          }

          setSession({
            isLoading: false,
            isAuthenticated: true,
            user: {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: (idTokenResult.claims.role as string) || 'user',
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
            },
          });
        } catch (error) {
          console.error('Error getting user session:', error);
          setSession({
            isLoading: false,
            isAuthenticated: false,
            user: null,
          });
          router.push('/auth/login');
        }
      } else {
        // Clear session when user is not authenticated
        await fetch('/api/auth/session', { method: 'DELETE' });
        setSession({
          isLoading: false,
          isAuthenticated: false,
          user: null,
        });
      }
    });

    return () => unsubscribe();
  }, [auth, router]);

  return session;
}

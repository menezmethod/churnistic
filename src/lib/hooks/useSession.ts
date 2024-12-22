import { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { auth } from '@/lib/firebase/client-app';
import { SessionUser } from '@/types/user';

export function useSession() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: User | null) => {
      setIsLoading(true);
      try {
        if (firebaseUser) {
          const idToken = await firebaseUser.getIdToken(true);
          const response = await fetch('/api/auth/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idToken }),
          });

          if (!response.ok) {
            throw new Error('Failed to create session');
          }

          const sessionResponse = await fetch('/api/auth/session');
          if (!sessionResponse.ok) {
            throw new Error('Failed to get session data');
          }

          const sessionData = await sessionResponse.json();
          setUser(sessionData);
          setIsAuthenticated(true);
        } else {
          await fetch('/api/auth/session', { method: 'DELETE' });
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error in session hook:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  return { isLoading, isAuthenticated, user };
}

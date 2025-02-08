import { User as FirebaseUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { getFirebaseAuth } from '@/lib/firebase/client-app';
import { User } from '@/types/user';

export function useSession() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    let unsubscribe = () => {};

    const initAuth = async () => {
      const auth = await getFirebaseAuth();
      unsubscribe = auth.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
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
    };

    initAuth();
    return () => unsubscribe();
  }, [router]);

  return { isLoading, isAuthenticated, user };
}

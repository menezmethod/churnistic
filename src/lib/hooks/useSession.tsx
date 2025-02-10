import { User } from 'next-auth';
import { useEffect, useState } from 'react';

export function useSession() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      console.log('[useSession] Session check started');
      try {
        await new Promise((resolve) => setTimeout(resolve, 200));

        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        });

        console.log('[useSession] Initial session response:', {
          status: response.status,
          ok: response.ok,
        });

        if (!response.ok) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          const retryResponse = await fetch('/api/auth/session', {
            credentials: 'include',
          });

          console.log('[useSession] Retry session response:', {
            status: retryResponse.status,
            ok: retryResponse.ok,
          });

          if (!retryResponse.ok) {
            setUser(null);
            setIsAuthenticated(false);
            console.log('[useSession] Session check failed after retry');
            return;
          }
          const retryData = await retryResponse.json();
          if (retryData) {
            setUser(retryData);
            setIsAuthenticated(true);
            console.log(
              '[useSession] Session check successful after retry, user:',
              retryData.email
            );
          } else {
            setUser(null);
            setIsAuthenticated(false);
            console.log('[useSession] Session check failed after retry (no data)');
          }
          return;
        }

        const data = await response.json();

        if (data) {
          setUser(data);
          setIsAuthenticated(true);
          console.log('[useSession] Session check successful, user:', data.email);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          console.log('[useSession] Session check failed (no data)');
        }
      } catch (error) {
        console.error('[useSession] Session check error:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
        console.log(
          '[useSession] Session check completed, isLoading:',
          false,
          ', isAuthenticated:',
          isAuthenticated
        );
      }
    };

    void checkSession();
  }, [isAuthenticated]);

  return { isLoading, isAuthenticated, user };
}

import { useEffect, useState } from 'react';

import { User } from '@/types/user';

export function useSession() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true); // Start loading when session check begins
      try {
        // Introduce a small initial delay (e.g., 200ms)
        await new Promise((resolve) => setTimeout(resolve, 200));

        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        });

        if (!response.ok) {
          // If initial check fails, retry once after a short delay
          await new Promise((resolve) => setTimeout(resolve, 300)); // Wait before retry
          const retryResponse = await fetch('/api/auth/session', {
            credentials: 'include',
          });

          if (!retryResponse.ok) {
            setUser(null);
            setIsAuthenticated(false);
            return; // Exit if retry also fails
          }
          const retryData = await retryResponse.json();
          if (retryData) {
            setUser(retryData);
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
          return; // Exit after successful retry or failure
        }

        const data = await response.json();

        if (data) {
          setUser(data);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Session check failed:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    void checkSession();
  }, []);

  return { isLoading, isAuthenticated, user };
}

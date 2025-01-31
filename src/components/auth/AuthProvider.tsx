'use client';

import { createContext, useContext, useEffect, useState } from 'react';

import { AppUser } from '@/lib/auth/types';

type AuthContextType = {
  user: AppUser | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthContextType>({ user: null, isLoading: true });

  useEffect(() => {
    const getAuthUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'same-origin',
        });

        if (response.ok) {
          const user = await response.json();
          setState({ user, isLoading: false });
        } else {
          setState({ user: null, isLoading: false });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setState({ user: null, isLoading: false });
      }
    };

    getAuthUser();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

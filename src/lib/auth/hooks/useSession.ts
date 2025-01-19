import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Permission, UserRole } from '@/lib/auth';
import { verifySession } from '@/lib/auth';
import { hasPermission, hasRole } from '@/lib/auth';

import { AUTH_ERRORS } from '../core/constants';

type Session = Awaited<ReturnType<typeof verifySession>>;

interface UseSessionOptions {
  redirectTo?: string;
  requiredRole?: UserRole;
  requiredPermissions?: Permission[];
}

export function useSession(options: UseSessionOptions = {}) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const sessionCookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('session='))
        ?.split('=')[1];

      if (!sessionCookie) {
        throw new Error(AUTH_ERRORS.INVALID_TOKEN);
      }

      const sessionData = await verifySession(sessionCookie, {
        requiredRole: options.requiredRole,
        requiredPermissions: options.requiredPermissions,
      });

      setSession(sessionData as Session);
      setError(null);
    } catch (err) {
      setSession(null);
      setError(err instanceof Error ? err.message : AUTH_ERRORS.INVALID_TOKEN);
      if (options.redirectTo) {
        router.push(options.redirectTo);
      }
    } finally {
      setLoading(false);
    }
  }, [options.redirectTo, options.requiredRole, options.requiredPermissions, router]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchSession();
  }, [fetchSession]);

  return {
    session,
    loading,
    error,
    refresh,
    isAuthenticated: !!session,
    hasRole: (role: UserRole) => (session ? hasRole(session.role, role) : false),
    hasPermission: (permission: Permission) =>
      session ? hasPermission(session.role, permission) : false,
  };
}

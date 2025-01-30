'use client';

import { CircularProgress } from '@mui/material';

import { useUser, useLogout } from '@/lib/auth/authConfig';

export function AuthDebug() {
  const { data: user, isPending, error } = useUser();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  if (isPending) {
    return <CircularProgress />;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!user) {
    return <div>Not logged in</div>;
  }

  return (
    <div>
      <h2>Auth Debug</h2>
      <pre>{JSON.stringify(user, null, 2)}</pre>
      <button onClick={() => logout({})} disabled={isLoggingOut}>
        {isLoggingOut ? 'Logging out...' : 'Logout'}
      </button>
    </div>
  );
}

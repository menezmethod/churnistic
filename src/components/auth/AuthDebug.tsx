'use client';

import { Box, Typography, Button, CircularProgress } from '@mui/material';

import { useUser, useLogout } from '@/lib/auth/authConfig';

export function AuthDebug() {
  const { data: user, isLoading, error } = useUser();
  const { mutate: logout, isLoading: isLoggingOut } = useLogout();

  if (isLoading) {
    return <CircularProgress />;
  }

  if (error) {
    return (
      <Typography color="error">
        Error: {error instanceof Error ? error.message : 'Unknown error'}
      </Typography>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Auth Debug
      </Typography>

      <Typography>Status: {user ? 'Authenticated' : 'Not authenticated'}</Typography>

      {user && (
        <>
          <Typography>Email: {user.email}</Typography>
          <Typography>Role: {user.customClaims?.role || 'No role'}</Typography>
          <Button variant="contained" onClick={() => logout({})} disabled={isLoggingOut}>
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </Button>
        </>
      )}
    </Box>
  );
}

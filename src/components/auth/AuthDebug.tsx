'use client';

import { Box, Typography, Button, CircularProgress } from '@mui/material';

import { useSession } from '@/lib/auth';

export function AuthDebug() {
  const { session, loading, error, refresh, isAuthenticated } = useSession();

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Auth Debug
      </Typography>

      <Typography>
        Status: {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
      </Typography>

      {session && (
        <>
          <Typography>Email: {session.email}</Typography>
          <Typography>Role: {session.role}</Typography>
          <Button variant="contained" onClick={refresh} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Session'}
          </Button>
        </>
      )}
    </Box>
  );
}

'use client';

import { Box, Typography, Button } from '@mui/material';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 2,
      }}
    >
      <Typography variant="h5" color="error" gutterBottom>
        {error.message || 'Something went wrong!'}
      </Typography>
      <Button variant="contained" onClick={reset} sx={{ textTransform: 'none' }}>
        Try again
      </Button>
    </Box>
  );
}

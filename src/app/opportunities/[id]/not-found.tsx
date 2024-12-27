'use client';

import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { Box, Typography, Button } from '@mui/material';
import Link from 'next/link';

export default function NotFound() {
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
      <Typography variant="h5" gutterBottom>
        Opportunity not found
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Could not find the requested opportunity.
      </Typography>
      <Link href="/opportunities" style={{ textDecoration: 'none' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          variant="contained"
          sx={{ textTransform: 'none' }}
        >
          Back to Opportunities
        </Button>
      </Link>
    </Box>
  );
}

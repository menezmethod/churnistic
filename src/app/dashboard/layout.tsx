'use client';

import { Box, Container, Stack } from '@mui/material';

import AppNavbar from '@/components/AppNavbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppNavbar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          backgroundColor: 'background.default',
        }}
      >
        <Container maxWidth="xl">
          <Stack spacing={3}>{children}</Stack>
        </Container>
      </Box>
    </Box>
  );
}

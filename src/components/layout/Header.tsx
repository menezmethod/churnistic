'use client';;
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { signOut } from '@/lib/firebase/auth';

import type { JSX } from "react";

export function Header(): JSX.Element {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const { error } = await signOut();
      if (error) {
        throw error;
      }
      router.push('/auth/signin');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Churnistic
          </Typography>
          {user && (
            <Button
              color="inherit"
              onClick={(): void => {
                void handleLogout();
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Logging out...' : 'Logout'}
            </Button>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
}

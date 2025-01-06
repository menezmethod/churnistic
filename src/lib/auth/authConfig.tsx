'use client';

import { Box, CircularProgress } from '@mui/material';
import { type ReactNode } from 'react';
import { configureAuth } from 'react-query-auth';

import {
  type AuthUser,
  type LoginCredentials,
  type RegisterCredentials,
  loadUser,
  loginWithEmail,
  registerWithEmail,
  logout,
} from './authService';

function LoadingSpinner() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <CircularProgress />
    </Box>
  );
}

export const { useUser, useLogin, useRegister, useLogout, AuthLoader } = configureAuth<
  AuthUser | null,
  Error,
  LoginCredentials,
  RegisterCredentials
>({
  userFn: loadUser,
  loginFn: loginWithEmail,
  registerFn: registerWithEmail,
  logoutFn: logout,
  loadingFallback: <LoadingSpinner />,
});

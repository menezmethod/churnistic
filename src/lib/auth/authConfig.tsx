'use client';

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
});

'use client';

import { configureAuth } from 'react-query-auth';

import { loadUser, loginWithEmail, registerWithEmail, logout } from './authService';

export const { useUser, useLogin, useRegister, useLogout, AuthLoader } = configureAuth({
  userFn: loadUser,
  loginFn: loginWithEmail,
  registerFn: registerWithEmail,
  logoutFn: logout,
});

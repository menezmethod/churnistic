import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';

import { useUser, useLogin, useRegister, useLogout } from '../authConfig';
import { AuthProvider, useAuth } from '../AuthContext';
import {
  loginWithGoogle,
  loginWithGithub,
  resetPassword as resetPasswordService,
} from '../authService';
import { UserRole, Permission } from '../types';

// Mock auth hooks
jest.mock('../authConfig', () => ({
  useUser: jest.fn(() => ({ data: null, isLoading: true })),
  useLogin: jest.fn(() => ({ mutateAsync: jest.fn() })),
  useRegister: jest.fn(() => ({ mutateAsync: jest.fn() })),
  useLogout: jest.fn(() => ({ mutateAsync: jest.fn() })),
}));

jest.mock('../authService', () => ({
  ...jest.requireActual('../authService'),
  loginWithGoogle: jest.fn(() => Promise.resolve({})),
  loginWithGithub: jest.fn(() => Promise.resolve({})),
  resetPassword: jest.fn(() =>
    Promise.resolve({
      success: true,
      message: 'Password reset email sent',
    })
  ),
}));

describe('AuthContext', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide initial auth context', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toEqual({
      user: null,
      loading: true,
      hasRole: expect.any(Function),
      hasPermission: expect.any(Function),
      signIn: expect.any(Function),
      signUp: expect.any(Function),
      signOut: expect.any(Function),
      signInWithGoogle: expect.any(Function),
      signInWithGithub: expect.any(Function),
      resetPassword: expect.any(Function),
      isOnline: true,
    });
  });

  describe('Authentication Methods', () => {
    it('should handle sign in', async () => {
      const mockLogin = jest.fn().mockResolvedValue({});
      (useLogin as jest.Mock).mockReturnValue({ mutateAsync: mockLogin });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signIn('test@example.com', 'password');
      });

      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
    });

    it('should handle sign up', async () => {
      const mockRegister = jest.fn().mockResolvedValue({});
      (useRegister as jest.Mock).mockReturnValue({ mutateAsync: mockRegister });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signUp('test@example.com', 'password');
      });

      expect(mockRegister).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
    });

    it('should handle sign out', async () => {
      const mockLogout = jest.fn().mockResolvedValue({});
      (useLogout as jest.Mock).mockReturnValue({ mutateAsync: mockLogout });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signOut();
      });

      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('Social Login', () => {
    it('should handle Google login', async () => {
      (loginWithGoogle as jest.Mock).mockResolvedValue({});

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signInWithGoogle();
      });

      expect(loginWithGoogle).toHaveBeenCalled();
    });

    it('should handle GitHub login', async () => {
      (loginWithGithub as jest.Mock).mockResolvedValue({});

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.signInWithGithub();
      });

      expect(loginWithGithub).toHaveBeenCalled();
    });
  });

  describe('Password Reset', () => {
    it('should handle password reset', async () => {
      const mockResetPassword = jest.fn().mockResolvedValue({
        success: true,
        message: 'Password reset email sent',
      });

      (resetPasswordService as jest.Mock).mockImplementation(mockResetPassword);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.resetPassword('test@example.com');
      });

      expect(mockResetPassword).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('Role and Permission Checking', () => {
    it('should check user role', () => {
      const mockUser = {
        customClaims: { role: UserRole.ADMIN },
      };
      (useUser as jest.Mock).mockReturnValue({ data: mockUser, isLoading: false });

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.hasRole(UserRole.ADMIN)).toBe(true);
      expect(result.current.hasRole(UserRole.USER)).toBe(false);
    });

    it('should check user permission', () => {
      const mockUser = {
        customClaims: { role: UserRole.ADMIN },
      };
      (useUser as jest.Mock).mockReturnValue({ data: mockUser, isLoading: false });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // ADMIN role has all permissions
      expect(result.current.hasPermission(Permission.MANAGE_SETTINGS)).toBe(true);
      expect(result.current.hasPermission(Permission.EDIT_OTHER_PROFILES)).toBe(true);

      // Test non-existent permission
      expect(result.current.hasPermission('INVALID_PERMISSION' as Permission)).toBe(
        false
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle sign in error', async () => {
      const mockLogin = jest.fn().mockRejectedValue(new Error('Auth failed'));
      (useLogin as jest.Mock).mockReturnValue({ mutateAsync: mockLogin });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await expect(
        act(async () => {
          await result.current.signIn('test@example.com', 'wrong_password');
        })
      ).rejects.toThrow('Auth failed');
    });
  });
});

import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';

import { AuthProvider, useAuth } from '@/lib/auth';
import { UserRole, Permission } from '@/lib/auth';

import { useUser, useLogin, useRegister, useLogout } from '../core/authConfig';
import {
  loginWithGoogle,
  loginWithGithub,
  resetPassword as resetPasswordService,
} from '../core/service';

// Mock auth hooks
jest.mock('../core/authConfig', () => ({
  useUser: jest.fn(() => ({ data: null, isLoading: true })),
  useLogin: jest.fn(() => ({ mutateAsync: jest.fn() })),
  useRegister: jest.fn(() => ({ mutateAsync: jest.fn() })),
  useLogout: jest.fn(() => ({ mutateAsync: jest.fn() })),
}));

jest.mock('../core/service', () => ({
  ...jest.requireActual('../core/service'),
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
      session: null,
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
        role: UserRole.ADMIN,
      };
      (useUser as jest.Mock).mockReturnValue({ data: mockUser, isLoading: false });

      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.hasRole(UserRole.ADMIN)).toBe(true);
      expect(result.current.hasRole(UserRole.USER)).toBe(true);
      expect(result.current.hasRole(UserRole.CONTRIBUTOR)).toBe(true);
    });

    it('should check contributor role permissions', () => {
      const mockUser = {
        role: UserRole.CONTRIBUTOR,
      };
      (useUser as jest.Mock).mockReturnValue({ data: mockUser, isLoading: false });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Contributor should have opportunity permissions
      expect(result.current.hasPermission(Permission.VIEW_OPPORTUNITIES)).toBe(true);
      expect(result.current.hasPermission(Permission.CREATE_OPPORTUNITIES)).toBe(true);
      expect(result.current.hasPermission(Permission.EDIT_OWN_OPPORTUNITIES)).toBe(true);
      expect(result.current.hasPermission(Permission.DELETE_OWN_OPPORTUNITIES)).toBe(
        true
      );

      // Contributor should not have admin permissions
      expect(result.current.hasPermission(Permission.MANAGE_SYSTEM)).toBe(false);
      expect(result.current.hasPermission(Permission.EDIT_OTHER_PROFILES)).toBe(false);
    });

    it('should check user permission', () => {
      const mockUser = {
        role: UserRole.ADMIN,
      };
      (useUser as jest.Mock).mockReturnValue({ data: mockUser, isLoading: false });

      const { result } = renderHook(() => useAuth(), { wrapper });

      // ADMIN role has all permissions
      expect(result.current.hasPermission(Permission.MANAGE_SYSTEM)).toBe(true);
      expect(result.current.hasPermission(Permission.EDIT_OTHER_PROFILES)).toBe(true);
      expect(result.current.hasPermission(Permission.VIEW_OPPORTUNITIES)).toBe(true);
      expect(result.current.hasPermission(Permission.CREATE_OPPORTUNITIES)).toBe(true);

      // Test non-existent permission
      expect(result.current.hasPermission('INVALID_PERMISSION' as Permission)).toBe(
        false
      );
    });

    it('should validate role hierarchy', () => {
      const adminUser = { role: UserRole.ADMIN };
      const contributorUser = { role: UserRole.CONTRIBUTOR };
      const userUser = { role: UserRole.USER };

      (useUser as jest.Mock).mockReturnValue({ data: adminUser, isLoading: false });
      const { result: adminResult } = renderHook(() => useAuth(), { wrapper });

      (useUser as jest.Mock).mockReturnValue({ data: contributorUser, isLoading: false });
      const { result: contributorResult } = renderHook(() => useAuth(), { wrapper });

      (useUser as jest.Mock).mockReturnValue({ data: userUser, isLoading: false });
      const { result: userResult } = renderHook(() => useAuth(), { wrapper });

      // Admin can access admin, contributor and user routes
      expect(adminResult.current.hasRole(UserRole.ADMIN)).toBe(true);
      expect(adminResult.current.hasRole(UserRole.CONTRIBUTOR)).toBe(true);
      expect(adminResult.current.hasRole(UserRole.USER)).toBe(true);

      // Contributor can only access contributor routes
      expect(contributorResult.current.hasRole(UserRole.CONTRIBUTOR)).toBe(true);
      expect(contributorResult.current.hasRole(UserRole.ADMIN)).toBe(false);
      expect(contributorResult.current.hasRole(UserRole.USER)).toBe(false);

      // User can only access user routes
      expect(userResult.current.hasRole(UserRole.USER)).toBe(true);
      expect(userResult.current.hasRole(UserRole.ADMIN)).toBe(false);
      expect(userResult.current.hasRole(UserRole.CONTRIBUTOR)).toBe(false);
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

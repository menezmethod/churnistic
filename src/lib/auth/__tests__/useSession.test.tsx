import { renderHook, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';

import { Permission, UserRole } from '@/lib/auth';
import { useSession } from '@/lib/auth';

import { AUTH_ERRORS } from '../core/constants';
import * as sessionService from '../services/session';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock session service
jest.mock('../services/session', () => ({
  verifySession: jest.fn(),
}));

describe('useSession', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockSessionCookie = 'mock.session.token';

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: `session=${mockSessionCookie}`,
    });
  });

  it('should handle successful session fetch', async () => {
    const mockSession = {
      uid: '123',
      email: 'test@example.com',
      role: UserRole.ADMIN,
      permissions: [Permission.MANAGE_SYSTEM],
      isSuperAdmin: false,
    };

    (sessionService.verifySession as jest.Mock).mockResolvedValueOnce(mockSession);

    const { result } = renderHook(() => useSession());

    // Initial state check
    expect(result.current.loading).toBe(true);
    expect(result.current.session).toBe(null);

    // Wait for session fetch
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.session).toEqual(mockSession);
    expect(result.current.error).toBe(null);
  });

  it('should handle session fetch error', async () => {
    (sessionService.verifySession as jest.Mock).mockRejectedValueOnce(
      new Error(AUTH_ERRORS.INVALID_TOKEN)
    );

    const { result } = renderHook(() => useSession());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.session).toBe(null);
    expect(result.current.error).toBe(AUTH_ERRORS.INVALID_TOKEN);
  });

  it('should redirect if session is missing and redirectTo is provided', async () => {
    Object.defineProperty(document, 'cookie', { writable: true, value: '' });

    const redirectTo = '/auth/signin';
    renderHook(() => useSession({ redirectTo }));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockRouter.push).toHaveBeenCalledWith(redirectTo);
  });

  it('should validate required role', async () => {
    (sessionService.verifySession as jest.Mock).mockRejectedValueOnce(
      new Error(AUTH_ERRORS.UNAUTHORIZED)
    );

    const { result } = renderHook(() => useSession({ requiredRole: UserRole.ADMIN }));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.session).toBe(null);
    expect(result.current.error).toBe(AUTH_ERRORS.UNAUTHORIZED);
  });

  it('should validate required permissions', async () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: `session=test-session`,
    });

    (sessionService.verifySession as jest.Mock).mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      throw new Error(AUTH_ERRORS.MISSING_PERMISSIONS);
    });

    const { result } = renderHook(() =>
      useSession({ requiredPermissions: [Permission.MANAGE_SYSTEM] })
    );

    // Initial state should be loading
    expect(result.current.loading).toBe(true);
    expect(result.current.session).toBe(null);
    expect(result.current.error).toBe(null);

    // Wait for session validation
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    // Final state after validation
    expect(result.current.loading).toBe(false);
    expect(result.current.session).toBe(null);
    expect(result.current.error).toBe(AUTH_ERRORS.MISSING_PERMISSIONS);
  });

  it('should refresh session', async () => {
    const mockSession = {
      uid: '123',
      email: 'test@example.com',
      role: UserRole.ADMIN,
      permissions: [Permission.MANAGE_SYSTEM],
      isSuperAdmin: false,
    };

    (sessionService.verifySession as jest.Mock)
      .mockRejectedValueOnce(new Error(AUTH_ERRORS.INVALID_TOKEN))
      .mockResolvedValueOnce(mockSession);

    const { result } = renderHook(() => useSession());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.session).toBe(null);
    expect(result.current.error).toBe(AUTH_ERRORS.INVALID_TOKEN);

    await act(async () => {
      result.current.refresh();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.session).toEqual(mockSession);
    expect(result.current.error).toBe(null);
  });
});

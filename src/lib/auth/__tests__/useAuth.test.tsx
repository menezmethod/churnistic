import { renderHook } from '@testing-library/react';
import { onAuthStateChanged } from 'firebase/auth';

import { UserRole } from '@/lib/auth/types';

import { AuthProvider, useAuth } from '../AuthContext';

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}));

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with null user', () => {
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback(null);
      return () => {};
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.user).toBeNull();
  });

  it('updates user state when auth state changes', () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      getIdTokenResult: jest.fn().mockResolvedValue({
        claims: {
          role: UserRole.USER,
          permissions: ['read:own'],
        },
      }),
      getIdToken: jest.fn().mockResolvedValue('mock-token'),
      customClaims: {
        role: UserRole.USER,
        permissions: ['read:own'],
      },
    };

    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback(mockUser);
      return () => {};
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it('correctly checks user roles', () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      getIdTokenResult: jest.fn().mockResolvedValue({
        claims: {
          role: UserRole.ADMIN,
          permissions: ['read:all'],
        },
      }),
      getIdToken: jest.fn().mockResolvedValue('mock-token'),
      customClaims: {
        role: UserRole.ADMIN,
        permissions: ['read:all'],
      },
    };

    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback(mockUser);
      return () => {};
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.hasRole(UserRole.ADMIN)).toBe(true);
    expect(result.current.hasRole(UserRole.USER)).toBe(false);
  });
});

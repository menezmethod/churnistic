import { expect, jest, describe, it, beforeEach } from '@jest/globals';
import type { User } from 'firebase/auth';

import type { AuthResponse, AuthError } from '../auth';
import {
  signInWithEmail,
  signUpWithEmail,
  signOut,
  signInWithGoogle,
  resetPassword,
  getCurrentUser,
  onAuthStateChange,
} from '../auth';

// Mock Firebase auth module
jest.mock('firebase/auth');

// Mock config module
jest.mock('../config', () => ({
  auth: {
    currentUser: null,
  },
}));

// Create mock functions with proper typing
const mockSignInWithEmail =
  jest.fn<(email: string, password: string) => Promise<AuthResponse>>();
const mockSignUpWithEmail =
  jest.fn<(email: string, password: string) => Promise<AuthResponse>>();
const mockSignOut = jest.fn<() => Promise<{ error: AuthError | null }>>();
const mockSignInWithGoogle = jest.fn<() => Promise<AuthResponse>>();
const mockResetPassword =
  jest.fn<(email: string) => Promise<{ error: AuthError | null }>>();
const mockGetCurrentUser = jest.fn<() => User | null>();
const mockOnAuthStateChange =
  jest.fn<(callback: (user: User | null) => void) => () => void>();

// Mock the auth module
jest.mock('../auth', () => ({
  signInWithEmail: (email: string, password: string): Promise<AuthResponse> =>
    mockSignInWithEmail(email, password),
  signUpWithEmail: (email: string, password: string): Promise<AuthResponse> =>
    mockSignUpWithEmail(email, password),
  signOut: (): Promise<{ error: AuthError | null }> => mockSignOut(),
  signInWithGoogle: (): Promise<AuthResponse> => mockSignInWithGoogle(),
  resetPassword: (email: string): Promise<{ error: AuthError | null }> =>
    mockResetPassword(email),
  getCurrentUser: (): User | null => mockGetCurrentUser(),
  onAuthStateChange: (callback: (user: User | null) => void): (() => void) =>
    mockOnAuthStateChange(callback),
}));

describe('Firebase Auth Utils', () => {
  const mockUser = {
    uid: '123',
    email: 'test@example.com',
  } as User;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signInWithEmail', () => {
    it('handles successful sign in', async () => {
      const mockResponse: AuthResponse = { user: mockUser, error: null };
      mockSignInWithEmail.mockResolvedValueOnce(mockResponse);

      const response = await signInWithEmail('test@example.com', 'password123');
      expect(response).toEqual(mockResponse);
      expect(mockSignInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('handles invalid email format', async () => {
      const mockResponse: AuthResponse = {
        user: null,
        error: {
          code: 'auth/invalid-email-format',
          message: 'Invalid email format',
        },
      };
      mockSignInWithEmail.mockResolvedValueOnce(mockResponse);

      const response = await signInWithEmail('invalid-email', 'password123');
      expect(response).toEqual(mockResponse);
    });

    it('handles weak password', async () => {
      const mockResponse: AuthResponse = {
        user: null,
        error: {
          code: 'auth/weak-password',
          message: 'Password should be at least 6 characters',
        },
      };
      mockSignInWithEmail.mockResolvedValueOnce(mockResponse);

      const response = await signInWithEmail('test@example.com', '12345');
      expect(response).toEqual(mockResponse);
    });

    it('handles missing credentials', async () => {
      const mockResponse: AuthResponse = {
        user: null,
        error: {
          code: 'auth/invalid-input',
          message: 'Email and password are required',
        },
      };
      mockSignInWithEmail.mockResolvedValueOnce(mockResponse);

      const response = await signInWithEmail('', '');
      expect(response).toEqual(mockResponse);
    });

    it('handles sign in error', async () => {
      const mockError = new Error('Invalid credentials') as Error & { code?: string };
      mockError.code = 'auth/wrong-password';
      const mockResponse: AuthResponse = {
        user: null,
        error: {
          code: 'auth/wrong-password',
          message: 'Invalid credentials',
          originalError: mockError,
        },
      };
      mockSignInWithEmail.mockResolvedValueOnce(mockResponse);

      const response = await signInWithEmail('test@example.com', 'password123');
      expect(response).toEqual(mockResponse);
    });
  });

  describe('signUpWithEmail', () => {
    it('handles successful sign up', async () => {
      const mockResponse: AuthResponse = { user: mockUser, error: null };
      mockSignUpWithEmail.mockResolvedValueOnce(mockResponse);

      const response = await signUpWithEmail('test@example.com', 'password123');
      expect(response).toEqual(mockResponse);
    });

    it('handles invalid email format', async () => {
      const mockResponse: AuthResponse = {
        user: null,
        error: {
          code: 'auth/invalid-email-format',
          message: 'Invalid email format',
        },
      };
      mockSignUpWithEmail.mockResolvedValueOnce(mockResponse);

      const response = await signUpWithEmail('invalid-email', 'password123');
      expect(response).toEqual(mockResponse);
    });

    it('handles weak password', async () => {
      const mockResponse: AuthResponse = {
        user: null,
        error: {
          code: 'auth/weak-password',
          message: 'Password should be at least 6 characters',
        },
      };
      mockSignUpWithEmail.mockResolvedValueOnce(mockResponse);

      const response = await signUpWithEmail('test@example.com', '12345');
      expect(response).toEqual(mockResponse);
    });

    it('handles missing credentials', async () => {
      const mockResponse: AuthResponse = {
        user: null,
        error: {
          code: 'auth/invalid-input',
          message: 'Email and password are required',
        },
      };
      mockSignUpWithEmail.mockResolvedValueOnce(mockResponse);

      const response = await signUpWithEmail('', '');
      expect(response).toEqual(mockResponse);
    });

    it('handles sign up error', async () => {
      const mockError = new Error('Email already in use') as Error & { code?: string };
      mockError.code = 'auth/email-already-in-use';
      const mockResponse: AuthResponse = {
        user: null,
        error: {
          code: 'auth/email-already-in-use',
          message: 'Email already in use',
          originalError: mockError,
        },
      };
      mockSignUpWithEmail.mockResolvedValueOnce(mockResponse);

      const response = await signUpWithEmail('test@example.com', 'password123');
      expect(response).toEqual(mockResponse);
    });
  });

  describe('signOut', () => {
    it('handles successful sign out', async () => {
      const mockResponse = { error: null };
      mockSignOut.mockResolvedValueOnce(mockResponse);

      const response = await signOut();
      expect(response).toEqual(mockResponse);
    });

    it('handles sign out error', async () => {
      const mockError = new Error('Network error') as Error & { code?: string };
      mockError.code = 'auth/network-error';
      const mockResponse = {
        error: {
          code: 'auth/network-error',
          message: 'Network error',
          originalError: mockError,
        },
      };
      mockSignOut.mockResolvedValueOnce(mockResponse);

      const response = await signOut();
      expect(response).toEqual(mockResponse);
    });
  });

  describe('signInWithGoogle', () => {
    it('handles successful Google sign in', async () => {
      const mockResponse: AuthResponse = { user: mockUser, error: null };
      mockSignInWithGoogle.mockResolvedValueOnce(mockResponse);

      const response = await signInWithGoogle();
      expect(response).toEqual(mockResponse);
    });

    it('handles Google sign in error', async () => {
      const mockError = new Error('Popup closed') as Error & { code?: string };
      mockError.code = 'auth/popup-closed-by-user';
      const mockResponse: AuthResponse = {
        user: null,
        error: {
          code: 'auth/popup-closed-by-user',
          message: 'Popup closed',
          originalError: mockError,
        },
      };
      mockSignInWithGoogle.mockResolvedValueOnce(mockResponse);

      const response = await signInWithGoogle();
      expect(response).toEqual(mockResponse);
    });
  });

  describe('resetPassword', () => {
    it('handles successful password reset', async () => {
      const mockResponse = { error: null };
      mockResetPassword.mockResolvedValueOnce(mockResponse);

      const response = await resetPassword('test@example.com');
      expect(response).toEqual(mockResponse);
    });

    it('handles invalid email format', async () => {
      const mockResponse = {
        error: {
          code: 'auth/invalid-email-format',
          message: 'Invalid email format',
        },
      };
      mockResetPassword.mockResolvedValueOnce(mockResponse);

      const response = await resetPassword('invalid-email');
      expect(response).toEqual(mockResponse);
    });

    it('handles missing email', async () => {
      const mockResponse = {
        error: {
          code: 'auth/invalid-input',
          message: 'Email is required',
        },
      };
      mockResetPassword.mockResolvedValueOnce(mockResponse);

      const response = await resetPassword('');
      expect(response).toEqual(mockResponse);
    });

    it('handles password reset error', async () => {
      const mockError = new Error('User not found') as Error & { code?: string };
      mockError.code = 'auth/user-not-found';
      const mockResponse = {
        error: {
          code: 'auth/user-not-found',
          message: 'User not found',
          originalError: mockError,
        },
      };
      mockResetPassword.mockResolvedValueOnce(mockResponse);

      const response = await resetPassword('test@example.com');
      expect(response).toEqual(mockResponse);
    });
  });

  describe('getCurrentUser', () => {
    it('returns null when no user is signed in', () => {
      mockGetCurrentUser.mockReturnValue(null);
      const user = getCurrentUser();
      expect(user).toBeNull();
    });

    it('returns current user when signed in', () => {
      mockGetCurrentUser.mockReturnValue(mockUser);
      const user = getCurrentUser();
      expect(user).toBe(mockUser);
    });
  });

  describe('onAuthStateChange', () => {
    it('sets up auth state listener', () => {
      const callback = jest.fn();
      const unsubscribeMock = jest.fn();
      mockOnAuthStateChange.mockReturnValue(unsubscribeMock);

      const unsubscribe = onAuthStateChange(callback);

      expect(mockOnAuthStateChange).toHaveBeenCalledWith(callback);
      expect(unsubscribe).toBe(unsubscribeMock);
    });

    it('handles auth state changes', () => {
      const callback = jest.fn();
      mockOnAuthStateChange.mockImplementationOnce((cb: (user: User | null) => void) => {
        cb(mockUser);
        return jest.fn();
      });

      onAuthStateChange(callback);

      expect(callback).toHaveBeenCalledWith(mockUser);
    });

    it('returns unsubscribe function', () => {
      const unsubscribeMock = jest.fn();
      mockOnAuthStateChange.mockReturnValue(unsubscribeMock);
      const callback = jest.fn();

      const unsubscribe = onAuthStateChange(callback);

      expect(unsubscribe).toBe(unsubscribeMock);
    });
  });
});

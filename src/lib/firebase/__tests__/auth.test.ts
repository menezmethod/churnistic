import type { User, AuthError } from 'firebase/auth';

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth';

import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithGithub,
  signOut,
  resetPassword,
} from '../auth';

// Mock firebase/app
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({
    name: '[DEFAULT]',
    options: {},
  })),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({
    name: '[DEFAULT]',
    options: {},
  })),
}));

// Mock firebase/auth
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  GoogleAuthProvider: jest.fn(() => ({
    addScope: jest.fn(),
  })),
  GithubAuthProvider: jest.fn(() => ({
    addScope: jest.fn(),
  })),
  signInWithPopup: jest.fn(),
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn(),
  })),
  sendPasswordResetEmail: jest.fn(),
}));

describe('Firebase Auth', () => {
  const mockUser = {
    uid: 'test-uid',
    email: 'test@example.com',
  } as User;

  const mockError = {
    code: 'auth/error-code',
    message: 'Test error message',
  } as AuthError;

  const expectedError = {
    code: mockError.code,
    message: mockError.message,
    originalError: mockError,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signInWithEmail', () => {
    it('should sign in successfully with email and password', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
      });

      const result = await signInWithEmail('test@example.com', 'password123');
      expect(result).toEqual({ user: mockUser, error: null });
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
    });

    it('should handle sign in errors', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(mockError);

      const result = await signInWithEmail('test@example.com', 'password');
      expect(result).toEqual({ user: null, error: expectedError });
    });

    it('should validate email format', async () => {
      const result = await signInWithEmail('invalid-email', 'password');
      expect(result).toEqual({
        user: null,
        error: {
          code: 'auth/invalid-email-format',
          message: 'Invalid email format',
        },
      });
    });

    it('should validate password length', async () => {
      const result = await signInWithEmail('test@example.com', '12345');
      expect(result).toEqual({
        user: null,
        error: {
          code: 'auth/weak-password',
          message: 'Password should be at least 6 characters',
        },
      });
    });
  });

  describe('signUpWithEmail', () => {
    it('should sign up successfully with email and password', async () => {
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
      });

      const result = await signUpWithEmail('test@example.com', 'password123');
      expect(result).toEqual({ user: mockUser, error: null });
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
    });

    it('should handle sign up errors', async () => {
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(mockError);

      const result = await signUpWithEmail('test@example.com', 'password');
      expect(result).toEqual({ user: null, error: expectedError });
    });

    it('should validate email format', async () => {
      const result = await signUpWithEmail('invalid-email', 'password');
      expect(result).toEqual({
        user: null,
        error: {
          code: 'auth/invalid-email-format',
          message: 'Invalid email format',
        },
      });
    });

    it('should validate password length', async () => {
      const result = await signUpWithEmail('test@example.com', '12345');
      expect(result).toEqual({
        user: null,
        error: {
          code: 'auth/weak-password',
          message: 'Password should be at least 6 characters',
        },
      });
    });
  });

  describe('signInWithGoogle', () => {
    it('should sign in successfully with Google', async () => {
      (signInWithPopup as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
      });

      const result = await signInWithGoogle();
      expect(result).toEqual({ user: mockUser, error: null });
      expect(GoogleAuthProvider).toHaveBeenCalled();
      expect(signInWithPopup).toHaveBeenCalledWith(expect.anything(), expect.any(Object));
    });

    it('should handle Google sign in errors', async () => {
      (signInWithPopup as jest.Mock).mockRejectedValueOnce(mockError);

      const result = await signInWithGoogle();
      expect(result).toEqual({ user: null, error: expectedError });
    });
  });

  describe('signInWithGithub', () => {
    it('should sign in successfully with GitHub', async () => {
      (signInWithPopup as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
      });

      const result = await signInWithGithub();
      expect(result).toEqual({ user: mockUser, error: null });
      expect(GithubAuthProvider).toHaveBeenCalled();
      expect(signInWithPopup).toHaveBeenCalledWith(expect.anything(), expect.any(Object));
    });

    it('should handle GitHub sign in errors', async () => {
      (signInWithPopup as jest.Mock).mockRejectedValueOnce(mockError);

      const result = await signInWithGithub();
      expect(result).toEqual({ user: null, error: expectedError });
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      (firebaseSignOut as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await signOut();
      expect(result).toEqual({ error: null });
      expect(firebaseSignOut).toHaveBeenCalled();
    });

    it('should handle sign out errors', async () => {
      (firebaseSignOut as jest.Mock).mockRejectedValueOnce(mockError);

      const result = await signOut();
      expect(result).toEqual({ error: expectedError });
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email successfully', async () => {
      (sendPasswordResetEmail as jest.Mock).mockResolvedValueOnce(undefined);

      const result = await resetPassword('test@example.com');
      expect(result).toEqual({ error: null });
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(expect.anything(), 'test@example.com');
    });

    it('should handle reset password errors', async () => {
      (sendPasswordResetEmail as jest.Mock).mockRejectedValueOnce(mockError);

      const result = await resetPassword('test@example.com');
      expect(result).toEqual({ error: expectedError });
    });

    it('should validate email is provided', async () => {
      const result = await resetPassword('');
      expect(result).toEqual({
        error: {
          code: 'auth/invalid-input',
          message: 'Email is required',
        },
      });
    });

    it('should validate email format', async () => {
      const result = await resetPassword('invalid-email');
      expect(result).toEqual({
        error: {
          code: 'auth/invalid-email-format',
          message: 'Invalid email format',
        },
      });
    });
  });

  describe('edge cases', () => {
    it('should handle network errors', async () => {
      const networkError = {
        code: 'auth/network-request-failed',
        message: 'Network error',
      } as AuthError;

      (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(networkError);

      const result = await signInWithEmail('test@example.com', 'password123');
      expect(result).toEqual({
        user: null,
        error: {
          code: networkError.code,
          message: networkError.message,
          originalError: networkError,
        },
      });
    });

    it('should handle too many requests error', async () => {
      const tooManyRequestsError = {
        code: 'auth/too-many-requests',
        message: 'Too many unsuccessful login attempts',
      } as AuthError;

      (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(tooManyRequestsError);

      const result = await signInWithEmail('test@example.com', 'password123');
      expect(result).toEqual({
        user: null,
        error: {
          code: tooManyRequestsError.code,
          message: tooManyRequestsError.message,
          originalError: tooManyRequestsError,
        },
      });
    });
  });
});

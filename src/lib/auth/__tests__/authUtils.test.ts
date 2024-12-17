import {
  signUp,
  signIn,
  signOut,
  signInWithGoogle,
  resetPassword,
  getCurrentUser,
} from '../authUtils';
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';

// Mock Firebase auth
jest.mock('firebase/auth');
jest.mock('../firebase', () => ({
  auth: {
    _currentUser: null,
    get currentUser() {
      return this._currentUser;
    },
  },
}));

describe('Auth Utils', () => {
  const mockUser = {
    email: 'test@example.com',
    uid: '123',
  };

  const mockError = new Error('Firebase Auth Error');

  beforeEach(() => {
    jest.clearAllMocks();
    (auth as any)._currentUser = null;
  });

  describe('signUp', () => {
    it('creates a new user successfully', async () => {
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({ user: mockUser });

      const result = await signUp('test@example.com', 'password123');
      expect(result).toEqual({ user: mockUser, error: null });
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password123');
    });

    it('handles signup error', async () => {
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(mockError);

      const result = await signUp('test@example.com', 'password123');
      expect(result).toEqual({ user: null, error: mockError });
    });
  });

  describe('signIn', () => {
    it('signs in user successfully', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({ user: mockUser });

      const result = await signIn('test@example.com', 'password123');
      expect(result).toEqual({ user: mockUser, error: null });
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password123');
    });

    it('handles signin error', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(mockError);

      const result = await signIn('test@example.com', 'password123');
      expect(result).toEqual({ user: null, error: mockError });
    });
  });

  describe('signOut', () => {
    it('signs out user successfully', async () => {
      (firebaseSignOut as jest.Mock).mockResolvedValue(undefined);

      const result = await signOut();
      expect(result).toEqual({ error: null });
      expect(firebaseSignOut).toHaveBeenCalledWith(auth);
    });

    it('handles signout error', async () => {
      (firebaseSignOut as jest.Mock).mockRejectedValue(mockError);

      const result = await signOut();
      expect(result).toEqual({ error: mockError });
    });
  });

  describe('signInWithGoogle', () => {
    it('signs in with Google successfully', async () => {
      (signInWithPopup as jest.Mock).mockResolvedValue({ user: mockUser });

      const result = await signInWithGoogle();
      expect(result).toEqual({ user: mockUser, error: null });
      expect(signInWithPopup).toHaveBeenCalledWith(auth, expect.any(GoogleAuthProvider));
    });

    it('handles Google signin error', async () => {
      (signInWithPopup as jest.Mock).mockRejectedValue(mockError);

      const result = await signInWithGoogle();
      expect(result).toEqual({ user: null, error: mockError });
    });
  });

  describe('resetPassword', () => {
    it('sends reset password email successfully', async () => {
      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

      const result = await resetPassword('test@example.com');
      expect(result).toEqual({ error: null });
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(auth, 'test@example.com');
    });

    it('handles reset password error', async () => {
      (sendPasswordResetEmail as jest.Mock).mockRejectedValue(mockError);

      const result = await resetPassword('test@example.com');
      expect(result).toEqual({ error: mockError });
    });
  });

  describe('getCurrentUser', () => {
    it('returns current user', () => {
      (auth as any)._currentUser = mockUser;
      expect(getCurrentUser()).toBe(mockUser);
    });

    it('returns null when no user is signed in', () => {
      (auth as any)._currentUser = null;
      expect(getCurrentUser()).toBeNull();
    });
  });
}); 
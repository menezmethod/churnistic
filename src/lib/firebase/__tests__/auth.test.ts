import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  GithubAuthProvider,
  onAuthStateChanged,
  User,
  type AuthError
} from 'firebase/auth';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithGithub,
  signOut,
  onAuthStateChange
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
}));

// Mock firebase config
jest.mock('../config', () => ({
  app: {
    name: '[DEFAULT]',
    options: {},
  },
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn(),
  },
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signInWithEmail', () => {
    it('should sign in successfully with email and password', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
      });

      const result = await signInWithEmail('test@example.com', 'password');
      expect(result).toEqual({ user: mockUser, error: null });
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password'
      );
    });

    it('should handle sign in errors', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(mockError);

      const result = await signInWithEmail('test@example.com', 'password');
      expect(result).toEqual({ user: null, error: mockError });
    });
  });

  describe('signUpWithEmail', () => {
    it('should sign up successfully with email and password', async () => {
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
      });

      const result = await signUpWithEmail('test@example.com', 'password');
      expect(result).toEqual({ user: mockUser, error: null });
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password'
      );
    });

    it('should handle sign up errors', async () => {
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(mockError);

      const result = await signUpWithEmail('test@example.com', 'password');
      expect(result).toEqual({ user: null, error: mockError });
    });
  });

  describe('signInWithGoogle', () => {
    it('should sign in successfully with Google', async () => {
      const provider = { addScope: jest.fn() };
      ((GoogleAuthProvider as unknown) as jest.Mock).mockReturnValueOnce(provider);
      (signInWithPopup as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
      });

      const result = await signInWithGoogle();
      expect(result).toEqual({ user: mockUser, error: null });
      expect(GoogleAuthProvider).toHaveBeenCalled();
      expect(signInWithPopup).toHaveBeenCalledWith(
        expect.anything(),
        provider
      );
    });

    it('should handle Google sign in errors', async () => {
      (signInWithPopup as jest.Mock).mockRejectedValueOnce(mockError);

      const result = await signInWithGoogle();
      expect(result).toEqual({ user: null, error: mockError });
    });
  });

  describe('signInWithGithub', () => {
    it('should sign in successfully with GitHub', async () => {
      const provider = { addScope: jest.fn() };
      ((GithubAuthProvider as unknown) as jest.Mock).mockReturnValueOnce(provider);
      (signInWithPopup as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
      });

      const result = await signInWithGithub();
      expect(result).toEqual({ user: mockUser, error: null });
      expect(GithubAuthProvider).toHaveBeenCalled();
      expect(signInWithPopup).toHaveBeenCalledWith(
        expect.anything(),
        provider
      );
    });

    it('should handle GitHub sign in errors', async () => {
      (signInWithPopup as jest.Mock).mockRejectedValueOnce(mockError);

      const result = await signInWithGithub();
      expect(result).toEqual({ user: null, error: mockError });
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
      expect(result).toEqual({ error: mockError });
    });
  });

  describe('onAuthStateChange', () => {
    it('should set up auth state observer', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      
      (onAuthStateChanged as jest.Mock).mockReturnValueOnce(mockUnsubscribe);

      const unsubscribe = onAuthStateChange(mockCallback);
      expect(onAuthStateChanged).toHaveBeenCalledWith(expect.anything(), mockCallback);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should handle auth state changes', () => {
      const mockCallback = jest.fn();
      (onAuthStateChanged as jest.Mock).mockImplementationOnce((auth, callback) => {
        callback(mockUser);
        return jest.fn();
      });

      onAuthStateChange(mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(mockUser);
    });

    it('should handle auth state changes with null user', () => {
      const mockCallback = jest.fn();
      (onAuthStateChanged as jest.Mock).mockImplementationOnce((auth, callback) => {
        callback(null);
        return jest.fn();
      });

      onAuthStateChange(mockCallback);
      expect(mockCallback).toHaveBeenCalledWith(null);
    });
  });
}); 
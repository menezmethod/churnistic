import { renderHook, act } from '@testing-library/react';
import { type User, type Auth } from 'firebase/auth';

import { useAuth, AuthProvider } from '@/lib/auth/AuthContext';
import { UserRole } from '@/lib/auth/types';

// Mock Firebase auth and manageSessionCookie before importing anything
const mockManageSessionCookie = jest.fn().mockResolvedValue(undefined);
jest.mock('@/lib/firebase/config', () => ({
  manageSessionCookie: (user: User) => mockManageSessionCookie(user),
}));

// Mock Firebase auth
const mockOnAuthStateChanged = jest.fn();
const mockGetAuth = jest.fn();
jest.mock('firebase/auth', () => ({
  getAuth: () => mockGetAuth,
  onAuthStateChanged: (auth: Auth, callback: (user: User | null) => void) => {
    mockOnAuthStateChanged(auth, callback);
    return () => {};
  },
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  GithubAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

// Mock the Firebase client app
jest.mock('@/lib/firebase/client-app', () => ({
  auth: {} as Auth,
}));

describe('useAuth Hook', () => {
  const mockAuthUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    customClaims: { role: 'USER' as UserRole },
    getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
  } as unknown as User;

  const mockAdminUser = {
    uid: 'admin-user-id',
    email: 'admin@example.com',
    customClaims: { role: 'ADMIN' as UserRole },
    getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
  } as unknown as User;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockManageSessionCookie.mockClear();
    mockOnAuthStateChanged.mockReset();
    mockGetAuth.mockReturnValue({} as Auth);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('initialization', () => {
    it('should initialize with loading state', () => {
      mockOnAuthStateChanged.mockImplementation(() => {
        // Don't call the callback immediately to simulate loading
        return () => {};
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBeNull();
    });

    it('should load user from localStorage if available', async () => {
      localStorage.setItem('user', JSON.stringify(mockAuthUser));

      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockAuthUser);
        return () => {};
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockManageSessionCookie).toHaveBeenCalledWith(mockAuthUser);
      expect(result.current.user).toEqual(mockAuthUser);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('loading state', () => {
    it('should set loading state during async operations', async () => {
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        // Don't call the callback immediately to simulate loading
        setTimeout(() => callback(mockAuthUser), 100);
        return () => {};
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
      });

      expect(mockManageSessionCookie).toHaveBeenCalledWith(mockAuthUser);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('role checks', () => {
    it('should check user role correctly', async () => {
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockAdminUser);
        return () => {};
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockManageSessionCookie).toHaveBeenCalledWith(mockAdminUser);
      expect(result.current.hasRole('ADMIN' as UserRole)).toBe(true);
      expect(result.current.hasRole('USER' as UserRole)).toBe(false);
    });
  });
});

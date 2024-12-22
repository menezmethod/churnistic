import { render, screen, waitFor } from '@testing-library/react';
import { onAuthStateChanged } from 'firebase/auth';

import { manageSessionCookie } from '@/lib/firebase/config';
import { ThemeProvider } from '@/lib/theme/ThemeContext';

import { AuthProvider, useAuth } from '../AuthContext';

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}));

jest.mock('@/lib/firebase/config', () => ({
  auth: {},
  db: {},
  functions: {},
  storage: {},
  manageSessionCookie: jest.fn(),
}));

const TestComponent = () => {
  const { user } = useAuth();
  return (
    <div data-testid="auth-status">
      {user ? 'User is logged in' : 'User is not logged in'}
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (manageSessionCookie as jest.Mock).mockResolvedValue(undefined);
  });

  it('initializes with null user', async () => {
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback(null);
      return () => {};
    });

    render(
      <ThemeProvider>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'User is not logged in'
      );
    });
  });

  it('updates user state when auth state changes', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      getIdTokenResult: jest.fn().mockResolvedValue({
        claims: {
          role: 'user',
          permissions: ['read:own'],
        },
      }),
    };

    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback(mockUser);
      return () => {};
    });

    render(
      <ThemeProvider>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('User is logged in');
    });
  });
});

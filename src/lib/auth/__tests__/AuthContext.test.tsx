import { render, screen, waitFor } from '@testing-library/react';
import { Auth, User, NextOrObserver } from 'firebase/auth';

import { useAuth, AuthProvider } from '../AuthContext';

// Mock Firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

jest.mock('firebase/auth', () => {
  const onAuthStateChanged = jest.fn();
  const mockAuth = {
    onAuthStateChanged,
    signOut: jest.fn(),
    currentUser: null,
  };
  return {
    getAuth: jest.fn(() => mockAuth),
    onAuthStateChanged,
  };
});

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  enableIndexedDbPersistence: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
}));

describe('AuthContext', () => {
  let mockAuth: jest.Mocked<Auth>;
  let mockUser: User;
  let mockOnAuthStateChanged: jest.Mock;

  beforeEach(() => {
    mockOnAuthStateChanged = jest.fn();
    mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      emailVerified: false,
      displayName: 'Test User',
      photoURL: null,
      phoneNumber: null,
      isAnonymous: false,
      tenantId: null,
      providerData: [],
      metadata: {
        creationTime: '2024-01-01',
        lastSignInTime: '2024-01-01',
      },
      refreshToken: '',
      delete: jest.fn(),
      getIdToken: jest.fn(),
      getIdTokenResult: jest.fn(),
      reload: jest.fn(),
      toJSON: jest.fn(),
      providerId: 'firebase',
    };
    mockAuth = {
      onAuthStateChanged: mockOnAuthStateChanged,
      currentUser: null,
      signOut: jest.fn(),
    } as unknown as jest.Mocked<Auth>;

    const mockAuthModule = jest.requireMock('firebase/auth');
    mockAuthModule.getAuth.mockReturnValue(mockAuth);
    mockAuthModule.onAuthStateChanged.mockImplementation((auth: Auth, callback: NextOrObserver<User | null>) => {
      if (typeof callback === 'function') {
        callback(null);
      }
      return () => {};
    });
  });

  it('provides auth context with initial null state', async () => {
    const TestComponent = () => {
      const { user } = useAuth();
      return <div>{user ? 'User is logged in' : 'No user'}</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No user')).toBeInTheDocument();
    });
  });

  it('updates context when auth state changes', async () => {
    const mockAuthModule = jest.requireMock('firebase/auth');
    mockAuthModule.onAuthStateChanged.mockImplementation((auth: Auth, callback: NextOrObserver<User | null>) => {
      if (typeof callback === 'function') {
        callback(mockUser);
      }
      return () => {};
    });

    const TestComponent = () => {
      const { user } = useAuth();
      return <div>{user ? 'User is logged in' : 'No user'}</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('User is logged in')).toBeInTheDocument();
    });
  });
});

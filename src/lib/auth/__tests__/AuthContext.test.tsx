import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { User } from 'firebase/auth';
import { act } from 'react';

const mockUser = {
  email: 'test@example.com',
  uid: '123',
} as User;

let authStateCallback: ((user: User | null) => void) | null = null;

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn((auth, callback) => {
    authStateCallback = callback;
    return () => {};
  }),
  getAuth: jest.fn(),
}));

jest.mock('../firebase', () => ({
  auth: {},
}));

const TestComponent = (): JSX.Element => {
  const { user, loading } = useAuth();
  return (
    <div>
      {loading ? (
        <div>Loading...</div>
      ) : user ? (
        <div>Logged in as {user.email}</div>
      ) : (
        <div>Not logged in</div>
      )}
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authStateCallback = null;
  });

  test('provides loading state initially', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('updates state when auth state changes', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await act(async () => {
      if (authStateCallback) {
        authStateCallback(mockUser);
      }
    });

    expect(screen.getByText(`Logged in as ${mockUser.email}`)).toBeInTheDocument();
  });

  test('handles sign out', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await act(async () => {
      if (authStateCallback) {
        authStateCallback(null);
      }
    });

    expect(screen.getByText('Not logged in')).toBeInTheDocument();
  });
});

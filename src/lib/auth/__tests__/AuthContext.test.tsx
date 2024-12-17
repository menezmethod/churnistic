import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { User } from 'firebase/auth';
import { auth } from '../firebase';

// Mock Firebase auth
jest.mock('../firebase', () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
  },
}));

describe('AuthContext', () => {
  const mockUser: Partial<User> = {
    email: 'test@example.com',
    uid: '123',
  };

  const TestComponent = (): JSX.Element => {
    const { user, loading } = useAuth();
    return (
      <div>
        {loading ? (
          'Loading...'
        ) : user ? (
          `Logged in as ${user.email}`
        ) : (
          'Not logged in'
        )}
      </div>
    );
  };

  beforeEach((): void => {
    (auth.onAuthStateChanged as jest.Mock).mockReset();
  });

  it('provides loading state initially', (): void => {
    (auth.onAuthStateChanged as jest.Mock).mockImplementation(() => () => {});

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('provides user when authenticated', async (): Promise<void> => {
    (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) => {
      callback(mockUser);
      return () => {};
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(await screen.findByText(`Logged in as ${mockUser.email}`)).toBeInTheDocument();
  });

  it('provides null user when not authenticated', async (): Promise<void> => {
    (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) => {
      callback(null);
      return () => {};
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(await screen.findByText('Not logged in')).toBeInTheDocument();
  });

  it('unsubscribes from auth state changes on unmount', (): void => {
    const unsubscribe = jest.fn();
    (auth.onAuthStateChanged as jest.Mock).mockImplementation(() => unsubscribe);

    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('throws error when useAuth is used outside AuthProvider', (): void => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow();

    consoleError.mockRestore();
  });
}); 
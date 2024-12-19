import { render, waitFor } from '@testing-library/react';
import { onAuthStateChanged } from 'firebase/auth';
import type { Mock } from 'jest-mock';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '../AuthContext';
import type { AuthUser } from '../types';
import { UserRole } from '../types';

// Mock Firebase auth
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn(),
}));

describe('AuthContext', () => {
  const mockUser = {
    uid: '123',
    email: 'test@example.com',
    getIdTokenResult: jest.fn().mockResolvedValue({
      claims: { role: 'user' },
    }),
  };

  const TestComponent = ({
    onAuthChange,
  }: {
    onAuthChange: (user: AuthUser | null) => void;
  }): JSX.Element => {
    const { user } = useAuth();

    useEffect(() => {
      onAuthChange(user);
    }, [user, onAuthChange]);

    return <div>Test Component</div>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides null user initially', () => {
    const onAuthChange = jest.fn();
    render(
      <AuthProvider>
        <TestComponent onAuthChange={onAuthChange} />
      </AuthProvider>
    );

    expect(onAuthChange).toHaveBeenCalledWith(null);
  });

  it('updates user state when auth state changes', async () => {
    const onAuthChange = jest.fn() as Mock<(user: AuthUser | null) => void>;
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      setTimeout(() => {
        callback(mockUser);
      }, 0);
      return (): void => {
        // Cleanup function
      };
    });

    render(
      <AuthProvider>
        <TestComponent onAuthChange={onAuthChange} />
      </AuthProvider>
    );

    await waitFor(
      () => {
        expect(onAuthChange.mock.calls.length).toBe(2);
        const user = onAuthChange.mock.calls[1][0] as AuthUser;
        expect(user).toBeDefined();
        expect(user.uid).toBe(mockUser.uid);
        expect(user.email).toBe(mockUser.email);
        expect(user.role).toBe(UserRole.USER);
      },
      { timeout: 2000 }
    );
  });

  it('handles user role from token claims', async () => {
    const onAuthChange = jest.fn() as Mock<(user: AuthUser | null) => void>;
    const adminUser = {
      ...mockUser,
      getIdTokenResult: jest.fn().mockResolvedValue({
        claims: { role: 'admin' },
      }),
    };

    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      setTimeout(() => {
        callback(adminUser);
      }, 0);
      return (): void => {
        // Cleanup function
      };
    });

    render(
      <AuthProvider>
        <TestComponent onAuthChange={onAuthChange} />
      </AuthProvider>
    );

    await waitFor(
      () => {
        expect(onAuthChange.mock.calls.length).toBe(2);
        const user = onAuthChange.mock.calls[1][0] as AuthUser;
        expect(user).toBeDefined();
        expect(user.uid).toBe(mockUser.uid);
        expect(user.email).toBe(mockUser.email);
        expect(user.role).toBe(UserRole.ADMIN);
      },
      { timeout: 2000 }
    );
  });
});

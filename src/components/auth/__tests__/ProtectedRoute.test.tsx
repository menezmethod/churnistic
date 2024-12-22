import { render, screen, waitFor } from '@testing-library/react';
import { type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/lib/auth/AuthContext';
import { UserRole } from '@/lib/auth/types';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/auth/AuthContext', () => ({
  ...jest.requireActual('@/lib/auth/AuthContext'),
  useAuth: jest.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('ProtectedRoute', () => {
  const mockPush = jest.fn();
  const mockAuthUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    customClaims: { role: UserRole.USER },
  } as unknown as User;

  const mockAdminUser = {
    uid: 'admin-user-id',
    email: 'admin@example.com',
    customClaims: { role: UserRole.ADMIN },
  } as unknown as User;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  const renderProtectedRoute = (user: User | null, requiredRole?: UserRole) => {
    return render(
      <ProtectedRoute requiredRole={requiredRole}>
        <div>Protected Content</div>
      </ProtectedRoute>
    );
  };

  describe('Authentication Check', () => {
    it('should redirect to login when no user is authenticated', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: false,
        hasRole: jest.fn(),
      });

      renderProtectedRoute(null);
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/signin');
      });
    });

    it('should render children when user is authenticated', async () => {
      const hasRole = jest.fn(() => true);
      (useAuth as jest.Mock).mockReturnValue({
        user: mockAuthUser,
        loading: false,
        hasRole,
      });

      renderProtectedRoute(mockAuthUser);
      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });
  });

  describe('Role-based Access', () => {
    it('should render content when user has required role', async () => {
      const hasRole = jest.fn(() => true);
      (useAuth as jest.Mock).mockReturnValue({
        user: mockAdminUser,
        loading: false,
        hasRole,
      });

      renderProtectedRoute(mockAdminUser, UserRole.ADMIN);
      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
        expect(hasRole).toHaveBeenCalledWith(UserRole.ADMIN);
      });
    });

    it('should redirect to unauthorized when user lacks required role', async () => {
      const hasRole = jest.fn(() => false);
      (useAuth as jest.Mock).mockReturnValue({
        user: mockAuthUser,
        loading: false,
        hasRole,
      });

      renderProtectedRoute(mockAuthUser, UserRole.ADMIN);
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/unauthorized');
        expect(hasRole).toHaveBeenCalledWith(UserRole.ADMIN);
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state', async () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        loading: true,
        hasRole: jest.fn(),
      });

      const { container } = renderProtectedRoute(null);
      await waitFor(() => {
        expect(container.querySelector('[role="status"]')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined user role gracefully', async () => {
      const hasRole = jest.fn(() => false);
      const userWithoutRole = { ...mockAuthUser, customClaims: undefined };
      (useAuth as jest.Mock).mockReturnValue({
        user: userWithoutRole,
        loading: false,
        hasRole,
      });

      renderProtectedRoute(userWithoutRole, UserRole.ADMIN);
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/unauthorized');
        expect(hasRole).toHaveBeenCalledWith(UserRole.ADMIN);
      });
    });

    it('should handle undefined required role gracefully', async () => {
      const hasRole = jest.fn(() => true);
      (useAuth as jest.Mock).mockReturnValue({
        user: mockAuthUser,
        loading: false,
        hasRole,
      });

      renderProtectedRoute(mockAuthUser);
      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
        expect(hasRole).not.toHaveBeenCalled();
      });
    });
  });
});

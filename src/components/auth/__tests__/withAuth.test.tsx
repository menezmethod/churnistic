import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth/AuthContext';
import type { UserRole } from '@/types/auth';

import { withAuth } from '../withAuth';
import type { AuthOptions } from '../withAuth';

// Mock the modules
jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('withAuth HOC', () => {
  const mockPush = jest.fn();
  const mockHasRole = jest.fn();
  const mockHasPermission = jest.fn();
  const TestComponent = (): JSX.Element => <div>Protected Content</div>;
  const WrappedComponent = withAuth(TestComponent);

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    mockPush.mockClear();
    mockHasRole.mockClear();
    mockHasPermission.mockClear();
  });

  it('renders loading state while checking authentication', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
      hasRole: mockHasRole,
      hasPermission: mockHasPermission,
    });
    render(<WrappedComponent />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects to sign in page when user is not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      hasRole: mockHasRole,
      hasPermission: mockHasPermission,
    });
    render(<WrappedComponent />);

    expect(mockPush).toHaveBeenCalledWith('/signin');
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders wrapped component when user is authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: '123' },
      loading: false,
      hasRole: mockHasRole,
      hasPermission: mockHasPermission,
    });
    render(<WrappedComponent />);

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('redirects to dashboard when user role is insufficient', () => {
    const authOptions: AuthOptions = { requiredRole: 'admin' as UserRole };
    const WrappedWithRole = withAuth(TestComponent, authOptions);
    mockHasRole.mockReturnValue(false);
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: '123', role: 'user' },
      loading: false,
      hasRole: mockHasRole,
      hasPermission: mockHasPermission,
    });

    render(<WrappedWithRole />);

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
    expect(mockHasRole).toHaveBeenCalledWith('admin');
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders component when user has required role', () => {
    const authOptions: AuthOptions = { requiredRole: 'admin' as UserRole };
    const WrappedWithRole = withAuth(TestComponent, authOptions);
    mockHasRole.mockReturnValue(true);
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: '123', role: 'admin' },
      loading: false,
      hasRole: mockHasRole,
      hasPermission: mockHasPermission,
    });

    render(<WrappedWithRole />);

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(mockHasRole).toHaveBeenCalledWith('admin');
    expect(mockPush).not.toHaveBeenCalled();
  });
});

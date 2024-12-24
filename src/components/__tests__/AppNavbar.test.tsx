import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth/AuthContext';
import { UserRole } from '@/lib/auth/types';

import AppNavbar from '../AppNavbar';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
}));

jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('AppNavbar', () => {
  const mockPush = jest.fn();
  const mockSignOut = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      signOut: mockSignOut,
      hasRole: () => false,
    });
  });

  it('renders app title', () => {
    render(<AppNavbar />);
    expect(screen.getByText('Churnistic')).toBeInTheDocument();
  });

  it('shows sign in and sign up buttons when logged out', () => {
    render(<AppNavbar />);
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
  });

  it('shows sign up link in drawer when logged out', () => {
    render(<AppNavbar />);
    const menuButton = screen.getByLabelText('open drawer');
    fireEvent.click(menuButton);
    const signUpLinks = screen.getAllByText('Sign Up');
    expect(signUpLinks.length).toBeGreaterThan(0);
  });

  it('hides protected menu items when logged out', () => {
    render(<AppNavbar />);
    const menuButton = screen.getByLabelText('open drawer');
    fireEvent.click(menuButton);
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Credit Cards')).not.toBeInTheDocument();
    expect(screen.queryByText('Bank Accounts')).not.toBeInTheDocument();
    expect(screen.queryByText('Investments')).not.toBeInTheDocument();
  });

  it('renders user avatar when user is logged in', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        email: 'test@example.com',
        photoURL: null,
      },
      signOut: mockSignOut,
      hasRole: (role: UserRole) => role === UserRole.USER,
    });

    render(<AppNavbar />);
    expect(screen.getByLabelText('account menu')).toBeInTheDocument();
  });

  it('shows protected menu items when logged in', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        email: 'test@example.com',
        photoURL: null,
      },
      signOut: mockSignOut,
      hasRole: (role: UserRole) => role === UserRole.USER,
    });

    render(<AppNavbar />);
    const menuButton = screen.getByLabelText('open drawer');
    fireEvent.click(menuButton);

    await waitFor(
      () => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    expect(screen.getByText('Opportunities')).toBeInTheDocument();
    expect(screen.getByText('Track Progress')).toBeInTheDocument();
    expect(screen.queryByText('Sign Up')).not.toBeInTheDocument();
  });

  it('shows admin menu items when user is admin', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        email: 'admin@example.com',
        photoURL: null,
      },
      signOut: mockSignOut,
      hasRole: (role: UserRole) => role === UserRole.ADMIN,
    });

    render(<AppNavbar />);
    const menuButton = screen.getByLabelText('open drawer');
    fireEvent.click(menuButton);
    expect(screen.getByText('User Management')).toBeInTheDocument();
  });

  it('signs out user when logout is clicked', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        email: 'test@example.com',
        photoURL: null,
      },
      signOut: mockSignOut.mockImplementation(() => {
        // Simulate successful sign out
        return Promise.resolve();
      }),
      hasRole: (role: UserRole) => role === UserRole.USER,
    });

    render(<AppNavbar />);
    const accountButton = screen.getByLabelText('account menu');
    fireEvent.click(accountButton);
    const logoutButton = screen.getByText('Sign Out');
    await fireEvent.click(logoutButton);

    expect(mockSignOut).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/signin');
  });
});

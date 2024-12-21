import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth/AuthContext';

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
      hasRole: jest.fn().mockReturnValue(false),
    });
  });

  it('renders app title', () => {
    render(<AppNavbar />);
    expect(screen.getByText('Churnistic')).toBeInTheDocument();
  });

  it('renders user avatar when user is logged in', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        email: 'test@example.com',
        photoURL: null,
      },
      signOut: mockSignOut,
      hasRole: jest.fn().mockReturnValue(false),
    });

    render(<AppNavbar />);
    expect(screen.getByLabelText('account of current user')).toBeInTheDocument();
  });

  it('opens drawer when menu button is clicked', () => {
    render(<AppNavbar />);
    const menuButton = screen.getByLabelText('open drawer');
    fireEvent.click(menuButton);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('shows admin menu items when user is admin', () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        email: 'admin@example.com',
        photoURL: null,
      },
      signOut: mockSignOut,
      hasRole: jest.fn().mockReturnValue(true),
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
      hasRole: jest.fn().mockReturnValue(false),
    });

    render(<AppNavbar />);
    const accountButton = screen.getByLabelText('account of current user');
    fireEvent.click(accountButton);
    const logoutButton = screen.getByText('Logout');
    await fireEvent.click(logoutButton);

    expect(mockSignOut).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/signin');
  });
});

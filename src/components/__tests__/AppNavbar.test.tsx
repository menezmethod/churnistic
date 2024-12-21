import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth/AuthContext';

import AppNavbar from '../AppNavbar';

// Mock the auth context
jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: function Link({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return <a href={href}>{children}</a>;
  },
}));

describe('AppNavbar', () => {
  const mockUser = {
    uid: '123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
  };

  const mockRouter = {
    push: jest.fn(),
  };

  const mockSignOut = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      signOut: mockSignOut,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders with user avatar when user is logged in', () => {
    render(<AppNavbar />);
    const avatarButton = screen.getByLabelText('account of current user');
    expect(avatarButton).toBeInTheDocument();
  });

  it('renders login button when user is not logged in', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });
    render(<AppNavbar />);
    const loginButton = screen.getByText('Login');
    expect(loginButton).toBeInTheDocument();
  });

  it('opens and closes user menu when clicking avatar', async () => {
    render(<AppNavbar />);
    const avatarButton = screen.getByLabelText('account of current user');

    // Open menu
    fireEvent.click(avatarButton);
    expect(screen.getByText('Settings')).toBeInTheDocument();

    // Close menu by clicking the menu close handler
    const menu = screen.getByRole('presentation');
    const backdrop = menu.querySelector('.MuiBackdrop-root') as HTMLElement;
    fireEvent.click(backdrop);

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('opens and closes drawer when clicking menu icon', async () => {
    render(<AppNavbar />);
    const menuButton = screen.getByLabelText('menu');

    // Open drawer
    fireEvent.click(menuButton);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();

    // Close drawer by clicking the close button
    const closeButton = screen.getByTestId('ChevronLeftIcon').closest('button');
    fireEvent.click(closeButton!);

    await waitFor(() => {
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });
  });

  it('calls signOut and navigates to signin when clicking logout button', async () => {
    render(<AppNavbar />);
    const avatarButton = screen.getByLabelText('account of current user');

    // Open menu
    fireEvent.click(avatarButton);

    // Click logout
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith('/auth/signin');
    });
  });

  it('navigates to correct routes when clicking menu items', async () => {
    render(<AppNavbar />);
    const menuButton = screen.getByLabelText('menu');

    // Open drawer
    fireEvent.click(menuButton);

    // Click Dashboard link
    const dashboardItem = screen.getByText('Dashboard').closest('.MuiListItem-root');
    fireEvent.click(dashboardItem!);

    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });

  it('handles user without displayName', () => {
    const userWithoutName = { ...mockUser, displayName: null };
    (useAuth as jest.Mock).mockReturnValue({
      user: userWithoutName,
      signOut: mockSignOut,
    });
    render(<AppNavbar />);
    const avatarButton = screen.getByLabelText('account of current user');
    expect(avatarButton).toBeInTheDocument();
  });

  it('handles user without photoURL', () => {
    const userWithoutPhoto = { ...mockUser, photoURL: null };
    (useAuth as jest.Mock).mockReturnValue({
      user: userWithoutPhoto,
      signOut: mockSignOut,
    });
    render(<AppNavbar />);
    const avatarButton = screen.getByLabelText('account of current user');
    expect(avatarButton).toBeInTheDocument();
  });

  it('navigates to login page when clicking login button', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });
    render(<AppNavbar />);
    const loginButton = screen.getByText('Login');
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/auth/signin');
    });
  });

  it('closes drawer when clicking backdrop', async () => {
    render(<AppNavbar />);
    const menuButton = screen.getByLabelText('menu');

    // Open drawer
    fireEvent.click(menuButton);

    // Close drawer by clicking backdrop
    const drawer = screen.getAllByRole('presentation')[0];
    const backdrop = drawer.querySelector('.MuiBackdrop-root') as HTMLElement;
    fireEvent.click(backdrop);

    await waitFor(() => {
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });
  });

  it('handles signOut error', async () => {
    const error = new Error('Failed to sign out');
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockSignOut.mockRejectedValueOnce(error);

    render(<AppNavbar />);
    const avatarButton = screen.getByLabelText('account of current user');

    // Open menu
    fireEvent.click(avatarButton);

    // Click logout
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalledWith('Error signing out:', error);
    });

    mockConsoleError.mockRestore();
  });

  it('renders drawer with all menu items', () => {
    render(<AppNavbar />);
    const menuButton = screen.getByLabelText('menu');

    // Open drawer
    fireEvent.click(menuButton);

    // Check all menu items are present in the drawer
    const drawer = screen.getAllByRole('presentation')[0];
    const menuItems = drawer.querySelectorAll('.MuiListItem-root');

    // First item should be the close button
    expect(menuItems[0]).toHaveTextContent('Menu');

    // Check menu items
    expect(menuItems[1]).toHaveTextContent('Dashboard');
    expect(menuItems[2]).toHaveTextContent('Cards');
    expect(menuItems[3]).toHaveTextContent('Settings');
  });
});

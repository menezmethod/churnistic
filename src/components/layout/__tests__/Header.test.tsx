import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth/AuthContext';
import { signOut } from '@/lib/firebase/auth';

import { Header } from '../Header';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

// Mock auth context
jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock Firebase auth
jest.mock('@/lib/firebase/auth', () => ({
  signOut: jest.fn(),
}));

describe('Header', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('renders app name', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });
    render(<Header />);
    expect(screen.getByText('Churnistic')).toBeInTheDocument();
  });

  it('does not render logout button when user is not logged in', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });
    render(<Header />);
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('renders logout button when user is logged in', () => {
    const mockUser = { uid: '123', email: 'test@example.com' } as User;
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    render(<Header />);
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('handles successful logout', async () => {
    const mockUser = { uid: '123', email: 'test@example.com' } as User;
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (signOut as jest.Mock).mockResolvedValueOnce({ error: null });

    render(<Header />);

    const logoutButton = screen.getByText('Logout');
    expect(logoutButton).not.toBeDisabled();

    fireEvent.click(logoutButton);

    // Button should be disabled and show loading state
    await waitFor(() => {
      expect(screen.getByText('Logging out...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    // Should redirect to sign in page
    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith('/auth/signin');
    });
  });

  it('handles logout error', async () => {
    const mockUser = { uid: '123', email: 'test@example.com' } as User;
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    const mockError = new Error('Logout failed');
    (signOut as jest.Mock).mockResolvedValueOnce({ error: mockError });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<Header />);

    fireEvent.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Logout error:', mockError);
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('handles unexpected logout error', async () => {
    const mockUser = { uid: '123', email: 'test@example.com' } as User;
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (signOut as jest.Mock).mockRejectedValueOnce(new Error('Unexpected error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<Header />);

    fireEvent.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Logout error:',
        new Error('Unexpected error')
      );
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('resets loading state after logout attempt', async () => {
    const mockUser = { uid: '123', email: 'test@example.com' } as User;
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (signOut as jest.Mock).mockResolvedValueOnce({ error: null });

    render(<Header />);

    fireEvent.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(screen.getByText('Logging out...')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByText('Logging out...')).not.toBeInTheDocument();
    });
  });
});

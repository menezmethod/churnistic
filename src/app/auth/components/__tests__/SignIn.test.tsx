import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth/AuthContext';
import { signInWithEmail, signInWithGoogle } from '@/lib/firebase/auth';

import { SignIn } from '../SignIn';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock auth context
jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock firebase auth
jest.mock('@/lib/firebase/auth', () => ({
  signInWithEmail: jest.fn(),
  signInWithGoogle: jest.fn(),
}));

describe('SignIn Component', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({ user: null });
    jest.clearAllMocks();
  });

  it('renders sign in form', () => {
    render(<SignIn />);
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByLabelText('Remember me')).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    render(<SignIn />);
    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    expect(
      await screen.findByText('Please enter a valid email address.')
    ).toBeInTheDocument();
  });

  it('shows validation error for short password', async () => {
    render(<SignIn />);
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(passwordInput, { target: { value: '12345' } });
    fireEvent.click(submitButton);

    expect(
      await screen.findByText('Password must be at least 6 characters long.')
    ).toBeInTheDocument();
  });

  it('handles sign in error', async () => {
    (signInWithEmail as jest.Mock).mockResolvedValue({
      error: { code: 'auth/wrong-password' },
    });

    render(<SignIn />);
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('email-helper-text')).toHaveTextContent(
        'Invalid email or password.'
      );
      expect(screen.getByTestId('password-helper-text')).toHaveTextContent(
        'Invalid email or password.'
      );
    });
  });

  it('redirects to dashboard on successful sign in', async () => {
    (signInWithEmail as jest.Mock).mockResolvedValue({ error: null });
    (useAuth as jest.Mock).mockReturnValue({ user: { email: 'test@example.com' } });

    render(<SignIn />);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('handles Google sign in', async () => {
    (signInWithGoogle as jest.Mock).mockResolvedValue({ error: null });
    render(<SignIn />);

    const googleButton = screen.getByRole('button', { name: /sign in with google/i });
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(signInWithGoogle).toHaveBeenCalled();
    });
  });

  it('handles Google sign in error', async () => {
    (signInWithGoogle as jest.Mock).mockResolvedValue({
      error: new Error('Google sign in failed'),
    });
    render(<SignIn />);

    const googleButton = screen.getByRole('button', { name: /sign in with google/i });
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(screen.getByTestId('email-helper-text')).toHaveTextContent(
        'An error occurred with Google sign in. Please try again.'
      );
    });
  });

  it('shows loading state during sign in', async () => {
    (signInWithEmail as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    render(<SignIn />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(screen.getByRole('button', { name: 'Signing in...' })).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
  });

  it('handles network error during sign in', async () => {
    (signInWithEmail as jest.Mock).mockRejectedValue(new Error('Network error'));
    render(<SignIn />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('email-helper-text')).toHaveTextContent(
        'An error occurred. Please try again.'
      );
    });
  });

  it('handles invalid-credential error', async () => {
    (signInWithEmail as jest.Mock).mockResolvedValue({
      error: { code: 'auth/invalid-credential' },
    });

    render(<SignIn />);
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('email-helper-text')).toHaveTextContent(
        'Invalid email or password.'
      );
      expect(screen.getByTestId('password-helper-text')).toHaveTextContent(
        'Invalid email or password.'
      );
    });
  });
});

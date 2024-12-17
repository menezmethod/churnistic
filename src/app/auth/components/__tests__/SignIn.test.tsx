import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth/AuthContext';
import { signInWithEmail, signInWithGoogle, signInWithGithub } from '@/lib/firebase/auth';

import { SignIn } from '../SignIn';

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the auth context
jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the auth functions
jest.mock('@/lib/firebase/auth', () => ({
  signInWithEmail: jest.fn(),
  signInWithGoogle: jest.fn(),
  signInWithGithub: jest.fn(),
}));

describe('SignIn Component', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({ user: null });
    jest.clearAllMocks();
  });

  it('renders sign in form', () => {
    render(<SignIn />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign in with google/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sign in with github/i })
    ).toBeInTheDocument();
  });

  it('redirects to dashboard if user is already authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { uid: '123' } });
    render(<SignIn />);

    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });

  it('validates email format', async () => {
    render(<SignIn />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /^sign in$/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    expect(
      await screen.findByText(/please enter a valid email address/i)
    ).toBeInTheDocument();
  });

  it('validates password length', async () => {
    render(<SignIn />);

    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /^sign in$/i });

    fireEvent.change(passwordInput, { target: { value: '12345' } });
    fireEvent.click(submitButton);

    expect(
      await screen.findByText(/password must be at least 6 characters/i)
    ).toBeInTheDocument();
  });

  it('handles successful email sign in', async () => {
    (signInWithEmail as jest.Mock).mockResolvedValue({ error: null });
    render(<SignIn />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /^sign in$/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(signInWithEmail).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('handles email sign in error', async () => {
    (signInWithEmail as jest.Mock).mockResolvedValue({
      error: { code: 'auth/wrong-password', message: 'Invalid password' },
    });
    render(<SignIn />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /^sign in$/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    expect(await screen.findByTestId('email-helper-text')).toHaveTextContent(
      /invalid email or password/i
    );
    expect(await screen.findByTestId('password-helper-text')).toHaveTextContent(
      /invalid email or password/i
    );
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

  it('handles GitHub sign in', async () => {
    (signInWithGithub as jest.Mock).mockResolvedValue({ error: null });
    render(<SignIn />);

    const githubButton = screen.getByRole('button', { name: /sign in with github/i });
    fireEvent.click(githubButton);

    await waitFor(() => {
      expect(signInWithGithub).toHaveBeenCalled();
    });
  });

  it('handles OAuth sign in errors', async () => {
    (signInWithGoogle as jest.Mock).mockResolvedValue({
      error: { code: 'auth/popup-closed-by-user', message: 'Popup closed' },
    });
    render(<SignIn />);

    const googleButton = screen.getByRole('button', { name: /sign in with google/i });
    fireEvent.click(googleButton);

    expect(
      await screen.findByText(/an error occurred with google sign in/i)
    ).toBeInTheDocument();
  });

  it('disables form during submission', async () => {
    (signInWithEmail as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    render(<SignIn />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /^sign in$/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
  });
});

import { screen, waitFor, fireEvent } from '@testing-library/dom';
import { render } from '@testing-library/react';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';

import { auth } from '@/lib/firebase/client';

import { SignIn } from '../SignIn';

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}));

describe('SignIn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<SignIn />);

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByLabelText('Remember me')).toBeInTheDocument();
  });

  it('validates email format', async () => {
    render(<SignIn />);

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    expect(
      await screen.findByText('Please enter a valid email address.')
    ).toBeInTheDocument();
  });

  it('validates password length', async () => {
    render(<SignIn />);

    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(passwordInput, { target: { value: '12345' } });
    fireEvent.click(submitButton);

    expect(
      await screen.findByText('Password must be at least 6 characters long.')
    ).toBeInTheDocument();
  });

  it('handles successful sign in', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
      user: { email: 'test@example.com' },
    });

    render(<SignIn />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        'test@example.com',
        'password123'
      );
    });
  });

  it('handles successful Google sign in', async () => {
    (signInWithPopup as jest.Mock).mockResolvedValueOnce({
      user: { email: 'test@example.com' },
    });

    render(<SignIn />);

    const googleButton = screen.getByRole('button', { name: /sign in with google/i });
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(signInWithPopup).toHaveBeenCalled();
    });
  });

  it('handles Google sign in error', async () => {
    (signInWithPopup as jest.Mock).mockRejectedValueOnce(
      new Error('Google sign in failed')
    );

    render(<SignIn />);

    const googleButton = screen.getByRole('button', { name: /sign in with google/i });
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(screen.getByTestId('email-helper-text')).toHaveTextContent(
        'Failed to sign in with Google'
      );
    });
  });

  it('shows loading state during sign in', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(<SignIn />);

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Sign in' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(screen.getByRole('button', { name: 'Signing in...' })).toBeInTheDocument();
  });

  it('handles wrong password error', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: 'auth/wrong-password',
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
        'Invalid email or password'
      );
    });
  });

  it('handles user not found error', async () => {
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValueOnce({
      code: 'auth/user-not-found',
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
        'No account found with this email'
      );
      expect(screen.getByTestId('password-helper-text')).toHaveTextContent(
        'Please check your email and password'
      );
    });
  });
});

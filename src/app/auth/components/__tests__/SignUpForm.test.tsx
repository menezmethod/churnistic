import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createUserWithEmailAndPassword } from 'firebase/auth';

import { auth } from '@/lib/firebase/client';

import SignUpForm from '../SignUpForm';

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
}));

describe('SignUpForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<SignUpForm />);

    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByTestId('displayname-input')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('signup-button')).toBeInTheDocument();
  });

  it('handles successful sign up', async () => {
    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
      user: { email: 'test@example.com' },
    });

    render(<SignUpForm />);

    const displayNameInput = screen
      .getByTestId('displayname-input')
      .querySelector('input');
    const emailInput = screen.getByTestId('email-input').querySelector('input');
    const passwordInput = screen.getByTestId('password-input').querySelector('input');
    const confirmPasswordInput = screen
      .getByTestId('confirm-password-input')
      .querySelector('input');

    if (!displayNameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
      throw new Error('Required inputs not found');
    }

    fireEvent.change(displayNameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        'test@example.com',
        'password123'
      );
    });
  });

  it('shows error when passwords do not match', async () => {
    render(<SignUpForm />);

    const emailInput = screen.getByTestId('email-input').querySelector('input');
    const passwordInput = screen.getByTestId('password-input').querySelector('input');
    const confirmPasswordInput = screen
      .getByTestId('confirm-password-input')
      .querySelector('input');

    if (!emailInput || !passwordInput || !confirmPasswordInput) {
      throw new Error('Required inputs not found');
    }

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } });

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByTestId('error-alert')).toHaveTextContent(
        'Passwords do not match'
      );
    });
  });

  it('shows error when sign up fails', async () => {
    (createUserWithEmailAndPassword as jest.Mock).mockRejectedValueOnce(
      new Error('Sign up failed')
    );

    render(<SignUpForm />);

    const emailInput = screen.getByTestId('email-input').querySelector('input');
    const passwordInput = screen.getByTestId('password-input').querySelector('input');
    const confirmPasswordInput = screen
      .getByTestId('confirm-password-input')
      .querySelector('input');

    if (!emailInput || !passwordInput || !confirmPasswordInput) {
      throw new Error('Required inputs not found');
    }

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

    const form = screen.getByRole('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByTestId('error-alert')).toHaveTextContent('Sign up failed');
    });
  });
});

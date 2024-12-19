import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth/AuthContext';
import { auth } from '@/lib/firebase/auth';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
}));

jest.mock('@/lib/firebase/auth', () => ({
  auth: {},
}));

import { SignUpForm } from '../SignUpForm';

describe('SignUpForm', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({ user: null });
  });

  it('redirects to dashboard if user is already authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { id: '1' } });
    render(<SignUpForm />);
    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    const emailInput = screen.getByTestId('email-input').querySelector('input');
    const passwordInput = screen.getByTestId('password-input').querySelector('input');
    const confirmPasswordInput = screen
      .getByTestId('confirm-password-input')
      .querySelector('input');
    const submitButton = screen.getByTestId('signup-button');

    if (!emailInput || !passwordInput || !confirmPasswordInput) {
      throw new Error('Required input elements not found');
    }

    await user.type(emailInput, 'invalid-email');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');

    const form = screen.getByRole('form');
    await user.click(submitButton);

    // Submit the form
    form.dispatchEvent(new Event('submit', { bubbles: true }));

    const errorMessage = await screen.findByRole('alert');
    expect(errorMessage).toHaveTextContent('Invalid email format');
  });

  it('validates password length', async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    const emailInput = screen.getByTestId('email-input').querySelector('input');
    const passwordInput = screen.getByTestId('password-input').querySelector('input');
    const confirmPasswordInput = screen
      .getByTestId('confirm-password-input')
      .querySelector('input');
    const submitButton = screen.getByTestId('signup-button');

    if (!emailInput || !passwordInput || !confirmPasswordInput) {
      throw new Error('Required input elements not found');
    }

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, '12345');
    await user.type(confirmPasswordInput, '12345');

    const form = screen.getByRole('form');
    await user.click(submitButton);

    // Submit the form
    form.dispatchEvent(new Event('submit', { bubbles: true }));

    const errorMessage = await screen.findByRole('alert');
    expect(errorMessage).toHaveTextContent('Password must be at least 6 characters');
  });

  it('validates password match', async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    const emailInput = screen.getByTestId('email-input').querySelector('input');
    const passwordInput = screen.getByTestId('password-input').querySelector('input');
    const confirmPasswordInput = screen
      .getByTestId('confirm-password-input')
      .querySelector('input');
    const submitButton = screen.getByTestId('signup-button');

    if (!emailInput || !passwordInput || !confirmPasswordInput) {
      throw new Error('Required input elements not found');
    }

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password456');
    await user.click(submitButton);

    await waitFor(() => {
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Passwords do not match');
    });
  });

  it('handles successful sign up', async () => {
    const user = userEvent.setup();
    render(<SignUpForm />);

    const emailInput = screen.getByTestId('email-input').querySelector('input');
    const passwordInput = screen.getByTestId('password-input').querySelector('input');
    const confirmPasswordInput = screen
      .getByTestId('confirm-password-input')
      .querySelector('input');
    const submitButton = screen.getByTestId('signup-button');

    if (!emailInput || !passwordInput || !confirmPasswordInput) {
      throw new Error('Required input elements not found');
    }

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        'test@example.com',
        'password123'
      );
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
    });
  });
});

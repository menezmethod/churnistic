import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/lib/auth/AuthContext';

import SignUpForm from '../SignUpForm';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('SignUpForm', () => {
  const mockPush = jest.fn();
  const mockSignUp = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (useAuth as jest.Mock).mockReturnValue({
      signUp: mockSignUp,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders sign up form correctly', () => {
    render(<SignUpForm />);
    expect(screen.getByTestId('signup-title')).toBeInTheDocument();
    expect(screen.getByTestId('displayname-input')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('signup-button')).toBeInTheDocument();
  });

  it('handles successful sign up', async () => {
    mockSignUp.mockResolvedValueOnce({});

    render(<SignUpForm />);

    fireEvent.change(screen.getByTestId('displayname-input'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByTestId('confirm-password-input'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByTestId('signup-button'));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        'Test User'
      );
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows error when passwords do not match', async () => {
    render(<SignUpForm />);

    fireEvent.change(screen.getByTestId('displayname-input'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByTestId('confirm-password-input'), {
      target: { value: 'differentpassword' },
    });

    fireEvent.click(screen.getByTestId('signup-button'));

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Passwords do not match'
      );
      expect(mockSignUp).not.toHaveBeenCalled();
    });
  });

  it('shows error when sign up fails', async () => {
    mockSignUp.mockRejectedValueOnce(new Error('Sign up failed'));

    render(<SignUpForm />);

    fireEvent.change(screen.getByTestId('displayname-input'), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByTestId('email-input'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByTestId('password-input'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByTestId('confirm-password-input'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByTestId('signup-button'));

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Sign up failed');
    });
  });
});

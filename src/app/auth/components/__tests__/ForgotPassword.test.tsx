import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { sendPasswordResetEmail } from 'firebase/auth';

import { auth } from '@/lib/firebase/client';

import { ForgotPassword } from '../ForgotPassword';

jest.mock('firebase/auth', () => ({
  sendPasswordResetEmail: jest.fn(),
}));

describe('ForgotPassword', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<ForgotPassword open onClose={mockOnClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('closes when cancel button is clicked', () => {
    render(<ForgotPassword open onClose={mockOnClose} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('sends password reset email successfully', async () => {
    (sendPasswordResetEmail as jest.Mock).mockResolvedValueOnce(undefined);

    render(<ForgotPassword open onClose={mockOnClose} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(auth, 'test@example.com');
    });

    expect(await screen.findByText(/password reset email sent/i)).toBeInTheDocument();

    await waitFor(
      () => {
        expect(mockOnClose).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );
  });

  it('shows error when no account exists', async () => {
    (sendPasswordResetEmail as jest.Mock).mockRejectedValueOnce(
      new Error('auth/user-not-found')
    );

    render(<ForgotPassword open onClose={mockOnClose} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/no account found/i)).toBeInTheDocument();
  });

  it('shows error when reset fails', async () => {
    (sendPasswordResetEmail as jest.Mock).mockRejectedValueOnce(new Error('Some error'));

    render(<ForgotPassword open onClose={mockOnClose} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/an error occurred/i)).toBeInTheDocument();
  });

  it('disables submit button while processing', async () => {
    (sendPasswordResetEmail as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(<ForgotPassword open onClose={mockOnClose} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    const cancelButton = screen.getByRole('button', { name: /cancel/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it('closes dialog when cancel is clicked', () => {
    render(<ForgotPassword open onClose={mockOnClose} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});

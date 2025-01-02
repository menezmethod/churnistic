import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { ForgotPassword } from '../ForgotPassword';

import { resetPassword } from '@/lib/firebase/auth';

// Mock the auth functions
jest.mock('@/lib/firebase/auth', () => ({
  resetPassword: jest.fn(),
}));

describe('ForgotPassword Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the dialog when open', () => {
    render(<ForgotPassword open={true} onClose={mockOnClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ForgotPassword open={false} onClose={mockOnClose} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('handles successful password reset', async () => {
    (resetPassword as jest.Mock).mockResolvedValue({ error: null });
    render(<ForgotPassword open={true} onClose={mockOnClose} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith('test@example.com');
    });

    expect(await screen.findByText(/password reset email sent/i)).toBeInTheDocument();

    // Wait for auto-close
    await waitFor(
      () => {
        expect(mockOnClose).toHaveBeenCalled();
      },
      { timeout: 3500 }
    );
  });

  it('handles user not found error', async () => {
    (resetPassword as jest.Mock).mockResolvedValue({
      error: { code: 'auth/user-not-found', message: 'User not found' },
    });
    render(<ForgotPassword open={true} onClose={mockOnClose} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/no account found/i)).toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('handles generic error', async () => {
    (resetPassword as jest.Mock).mockRejectedValue(new Error('Network error'));
    render(<ForgotPassword open={true} onClose={mockOnClose} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/an error occurred/i)).toBeInTheDocument();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('disables form during submission', async () => {
    (resetPassword as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    render(<ForgotPassword open={true} onClose={mockOnClose} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send reset link/i });
    const cancelButton = screen.getByRole('button', { name: /cancel/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it('closes dialog when cancel is clicked', () => {
    render(<ForgotPassword open={true} onClose={mockOnClose} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});

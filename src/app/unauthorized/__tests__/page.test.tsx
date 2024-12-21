import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';

import UnauthorizedPage from '../page';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('UnauthorizedPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it('renders unauthorized message', () => {
    render(<UnauthorizedPage />);
    expect(screen.getByTestId('error-title')).toHaveTextContent(/access denied/i);
    expect(screen.getByTestId('error-message')).toHaveTextContent(
      /please sign in to access this page/i
    );
  });

  it('renders navigation buttons', () => {
    render(<UnauthorizedPage />);
    expect(screen.getByTestId('home-button')).toBeInTheDocument();
    expect(screen.getByTestId('signin-button')).toBeInTheDocument();
  });

  it('navigates to home page when home button is clicked', () => {
    render(<UnauthorizedPage />);
    fireEvent.click(screen.getByTestId('home-button'));
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('navigates to sign in page when sign in button is clicked', () => {
    render(<UnauthorizedPage />);
    fireEvent.click(screen.getByTestId('signin-button'));
    expect(mockPush).toHaveBeenCalledWith('/auth/signin');
  });
});

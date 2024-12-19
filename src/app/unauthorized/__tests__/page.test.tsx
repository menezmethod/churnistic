import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';

import UnauthorizedPage from '../page';

// Mock the modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('UnauthorizedPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    mockPush.mockClear();
  });

  it('renders unauthorized message', () => {
    render(<UnauthorizedPage />);
    expect(screen.getByText(/Unauthorized Access/i)).toBeInTheDocument();
    expect(
      screen.getByText(/You don't have permission to access this page/i)
    ).toBeInTheDocument();
  });

  it('renders return to home button', () => {
    render(<UnauthorizedPage />);
    expect(screen.getByText(/Return to Home/i)).toBeInTheDocument();
  });

  it('navigates to home page when return button is clicked', () => {
    render(<UnauthorizedPage />);
    fireEvent.click(screen.getByText(/Return to Home/i));
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('displays 401 error code', () => {
    render(<UnauthorizedPage />);
    expect(screen.getByText('401')).toBeInTheDocument();
  });
});

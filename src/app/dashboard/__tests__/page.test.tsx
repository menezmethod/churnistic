import { screen, waitFor } from '@testing-library/dom';
import { render } from '@testing-library/react';

import { useAuth } from '@/lib/auth/AuthContext';

import DashboardPage from '../page';

jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders welcome message', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { displayName: 'Test User' },
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
    });
  });

  it('renders currently tracking section', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { displayName: 'Test User' },
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Currently Tracking')).toBeInTheDocument();
    });
  });

  it('renders recent activity section', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { displayName: 'Test User' },
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });
  });

  it('shows loading state', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
    });

    render(<DashboardPage />);

    await waitFor(() => {
      const skeletons = screen.getAllByTestId('opportunity-card-skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });
});

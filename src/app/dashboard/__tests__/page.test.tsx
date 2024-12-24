// Third-party imports
import { render, screen, waitFor } from '@testing-library/react';

// Local imports
import DashboardPage from '../page';

// Mock the useAuth hook
jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: () => ({
    user: {
      uid: 'test-uid',
      email: 'test@example.com',
    },
    loading: false,
  }),
}));

describe('DashboardPage', () => {
  it('renders dashboard title', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Churning Dashboard')).toBeInTheDocument();
    });
  });

  it('renders stats overview', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Total Earned YTD')).toBeInTheDocument();
      expect(screen.getByText('Success Rate')).toBeInTheDocument();
      expect(screen.getAllByText('Active Opportunities')[0]).toBeInTheDocument();
    });
  });

  it('renders activity timeline', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Activity Timeline')).toBeInTheDocument();
      expect(screen.getAllByText('Filter')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Sort')[0]).toBeInTheDocument();
    });
  });

  it('renders view tabs', async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Cards View')).toBeInTheDocument();
      expect(screen.getByText('Grid View')).toBeInTheDocument();
    });
  });
});

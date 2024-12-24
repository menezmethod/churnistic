import { render, screen, waitFor } from '@testing-library/react';

import { useAuth } from '@/lib/auth/AuthContext';

import DashboardPage from '../page';

jest.mock('@/lib/auth/AuthContext');

const mockStats = {
  total_value: 5000,
  opportunities_count: {
    credit_cards: 3,
    bank_accounts: 2,
    total: 5
  },
  success_rate: 0.8,
  average_completion_time: 30,
  total_earned_ytd: 2500
};

const mockEvents = [
  {
    date: '2024-01-01',
    type: 'Application',
    description: 'Applied for Chase Sapphire Preferred',
    status: 'completed'
  }
];

describe('DashboardPage', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        email: 'test@example.com',
        displayName: 'Test User',
      },
    });
  });

  it('renders activity timeline', async () => {
    render(<DashboardPage initialStats={mockStats} initialEvents={mockEvents} />);
    await waitFor(
      () => {
        expect(screen.getByText('Activity Timeline')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });

  it('renders stats overview', async () => {
    render(<DashboardPage initialStats={mockStats} initialEvents={mockEvents} />);
    await waitFor(
      () => {
        expect(screen.getByText('Total Earned YTD')).toBeInTheDocument();
        expect(screen.getByText('Success Rate')).toBeInTheDocument();
        expect(screen.getByText('Active Opportunities')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });

  it('renders filter and sort buttons', async () => {
    render(<DashboardPage initialStats={mockStats} initialEvents={mockEvents} />);
    await waitFor(
      () => {
        expect(screen.getByText('Filter')).toBeInTheDocument();
        expect(screen.getByText('Sort')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  });
});

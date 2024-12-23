import { render, screen, waitFor } from '@testing-library/react';

import { useAuth } from '@/lib/auth/AuthContext';

import DashboardPage from '../page';

jest.mock('@/lib/auth/AuthContext');

describe('DashboardPage', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: {
        email: 'test@example.com',
        displayName: 'Test User',
      },
    });
  });

  it('renders welcome message', async () => {
    render(<DashboardPage />);
    await waitFor(
      () => {
        expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('renders summary cards', async () => {
    render(<DashboardPage />);
    await waitFor(
      () => {
        expect(screen.getByText('Active Cards')).toBeInTheDocument();
        expect(screen.getByText('Bank Bonuses')).toBeInTheDocument();
        expect(screen.getByText('Next Deadline')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('renders recent applications section', async () => {
    render(<DashboardPage />);
    await waitFor(
      () => {
        expect(screen.getByText('Recent Card Applications')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('renders settings button', async () => {
    render(<DashboardPage />);
    await waitFor(
      () => {
        expect(screen.getByText('Settings')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });
});

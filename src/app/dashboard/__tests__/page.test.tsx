import { render, screen } from '@testing-library/react';

import { useAuth } from '@/lib/auth/AuthContext';
import { trpc } from '@/lib/trpc/client';

import DashboardPage from '../page';

// Mock the modules
jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock tRPC with proper types
jest.mock('@/lib/trpc/client', () => ({
  trpc: {
    bank: {
      getAccounts: {
        useQuery: jest.fn(),
      },
    },
    card: {
      getApplications: {
        useQuery: jest.fn(),
      },
    },
  },
}));

describe('DashboardPage', () => {
  const mockHasPermission = jest.fn(() => true);
  const mockHasRole = jest.fn(() => true);

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { uid: '123', email: 'test@example.com' },
      hasPermission: mockHasPermission,
      hasRole: mockHasRole,
    });
    (trpc.bank.getAccounts.useQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });
    (trpc.card.getApplications.useQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
    });
    mockHasPermission.mockClear();
    mockHasRole.mockClear();
  });

  it('renders dashboard title', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders card management section', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Card Management')).toBeInTheDocument();
    expect(
      screen.getByText(/Track and manage your credit card applications/)
    ).toBeInTheDocument();
    expect(screen.getByText('View Cards')).toBeInTheDocument();
  });

  it('renders rewards tracking section', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Rewards Tracking')).toBeInTheDocument();
    expect(
      screen.getByText(/Monitor your points, miles, and cashback/)
    ).toBeInTheDocument();
    expect(screen.getByText('View Rewards')).toBeInTheDocument();
  });

  it('renders application status section', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Application Status')).toBeInTheDocument();
    expect(
      screen.getByText(/Check the status of your pending card applications/)
    ).toBeInTheDocument();
    expect(screen.getByText('View Status')).toBeInTheDocument();
  });
});

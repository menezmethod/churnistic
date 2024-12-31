import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { useOpportunities } from '../../../hooks/useOpportunities';
import DashboardPage from '../page';

// Create a theme instance for testing
const theme = createTheme({
  palette: {
    mode: 'dark',
  },
});

// Mock next/link
jest.mock('next/link', () => {
  return React.forwardRef<HTMLAnchorElement, { children: React.ReactNode; href: string }>(
    function Link({ children, href }, ref) {
      return (
        <a href={href} ref={ref}>
          {children}
        </a>
      );
    }
  );
});

// Mock the opportunities hook
jest.mock('../../../hooks/useOpportunities', () => ({
  useOpportunities: jest.fn(() => ({
    opportunities: [
      {
        id: '1',
        title: 'Test Opportunity',
        value: '1000',
        type: 'credit_card',
        bank: 'Test Bank',
        description: 'Test Description',
        requirements: ['Requirement 1'],
        source: 'Test Source',
        sourceLink: 'https://test.com',
        postedDate: '2024-01-01',
        confidence: 0.9,
        status: 'active',
      },
    ],
    loading: false,
    error: null,
  })),
}));
// Mock the session hook
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        name: 'Test User',
        email: 'test@example.com',
      },
    },
    status: 'authenticated',
  }),
}));

// Mock the auth context
jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: () => ({
    user: {
      name: 'Test User',
      email: 'test@example.com',
      displayName: 'Test User',
    },
    isAuthenticated: true,
    loading: false,
  }),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: function MotionDiv({
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement>) {
      return <div {...props}>{children}</div>;
    },
  },
  AnimatePresence: function AnimatePresence({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  },
}));

// Mock the MUI Fade component
jest.mock('@mui/material/Fade', () => {
  return function Fade({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  };
});

// Mock MUI Lab components and classes
jest.mock('@mui/lab', () => {
  const timelineItemClasses = {
    root: 'MuiTimelineItem-root',
  };

  return {
    Timeline: function Timeline({
      children,
    }: {
      children: React.ReactNode;
      sx?: Record<string, unknown>;
    }) {
      return <div data-testid="timeline">{children}</div>;
    },
    TimelineItem: function TimelineItem({ children }: { children: React.ReactNode }) {
      return (
        <div data-testid="timeline-item" className="MuiTimelineItem-root">
          {children}
        </div>
      );
    },
    TimelineSeparator: function TimelineSeparator({
      children,
    }: {
      children: React.ReactNode;
    }) {
      return <div data-testid="timeline-separator">{children}</div>;
    },
    TimelineDot: function TimelineDot({ children }: { children: React.ReactNode }) {
      return <div data-testid="timeline-dot">{children}</div>;
    },
    TimelineConnector: function TimelineConnector() {
      return <div data-testid="timeline-connector" />;
    },
    TimelineContent: function TimelineContent({
      children,
    }: {
      children: React.ReactNode;
    }) {
      return <div data-testid="timeline-content">{children}</div>;
    },
    LoadingButton: function LoadingButton({ children }: { children: React.ReactNode }) {
      return <button data-testid="loading-button">{children}</button>;
    },
    timelineItemClasses,
  };
});

// Mock the skeleton components
jest.mock('../../../components/skeletons/OpportunityCardSkeleton', () => {
  return function OpportunityCardSkeleton() {
    return <div data-testid="opportunity-card-skeleton" />;
  };
});

jest.mock('../../../components/skeletons/StatCardSkeleton', () => {
  return function StatCardSkeleton() {
    return <div data-testid="stat-card-skeleton" />;
  };
});

jest.mock('../../../components/skeletons/ProgressCardSkeleton', () => {
  return function ProgressCardSkeleton() {
    return <div data-testid="progress-card-skeleton" />;
  };
});

// Mock @emotion/react
jest.mock('@emotion/react', () => ({
  ...jest.requireActual('@emotion/react'),
  keyframes: () => 'animation-name',
}));

const renderWithTheme = (component: React.ReactElement<unknown>) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('DashboardPage', () => {
  beforeEach(() => {
    (useOpportunities as jest.Mock).mockImplementation(() => ({
      opportunities: [
        {
          id: '1',
          title: 'Test Opportunity',
          value: '1000',
          type: 'credit_card',
          bank: 'Test Bank',
          description: 'Test Description',
          requirements: ['Requirement 1'],
          source: 'Test Source',
          sourceLink: 'https://test.com',
          postedDate: '2024-01-01',
          confidence: 0.9,
          status: 'active',
        },
      ],
      loading: false,
      error: null,
    }));
  });

  it('renders welcome message', async () => {
    renderWithTheme(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
    });
  });

  it('renders currently tracking section', async () => {
    renderWithTheme(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Currently Tracking')).toBeInTheDocument();
    });
  });

  it('renders recent activity section', async () => {
    renderWithTheme(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });
  });

  it('renders skeleton components while loading', async () => {
    (useOpportunities as jest.Mock).mockImplementationOnce(() => ({
      opportunities: [],
      loading: true,
      error: null,
      isLoading: true,
    }));

    renderWithTheme(<DashboardPage />);
    await waitFor(
      () => {
        const skeletons = screen.getAllByTestId('opportunity-card-skeleton');
        expect(skeletons).toHaveLength(3);
      },
      { timeout: 2000 }
    );
  });
});

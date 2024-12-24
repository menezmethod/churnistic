import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';

import DashboardPage from '../page';

// Mock the useAuth hook
jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: () => ({
    user: {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
    },
    loading: false,
  }),
}));

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const theme = createTheme();

describe('DashboardPage', () => {
  const renderWithTheme = (component: React.ReactNode) => {
    return render(
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    );
  };

  it('renders welcome message', () => {
    renderWithTheme(<DashboardPage />);
    expect(screen.getByText(/Welcome back, Test/)).toBeInTheDocument();
  });

  it('renders quick opportunities section', () => {
    renderWithTheme(<DashboardPage />);
    expect(screen.getByText('Quick Opportunities')).toBeInTheDocument();
  });

  it('renders currently tracking section', () => {
    renderWithTheme(<DashboardPage />);
    expect(screen.getByText('Currently Tracking')).toBeInTheDocument();
  });

  it('renders recent activity section', () => {
    renderWithTheme(<DashboardPage />);
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });
});

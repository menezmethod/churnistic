import { render, screen } from '@testing-library/react';
import RootLayout from '../layout';

// Mock the theme provider and other dependencies
jest.mock('@mui/material-nextjs/v14-appRouter', () => ({
  AppRouterCacheProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="cache-provider">{children}</div>,
}));

jest.mock('@mui/material/styles', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="theme-provider">{children}</div>,
  createTheme: () => ({
    palette: {
      primary: { main: '#2E7D32' },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
    },
  }),
}));

jest.mock('@mui/material/CssBaseline', () => ({
  __esModule: true,
  default: () => null,
}));

// Mock the theme
jest.mock('@/theme/theme', () => ({
  theme: {
    palette: {
      primary: { main: '#2E7D32' },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
    },
  },
}));

// Mock next/document to handle html and body tags
jest.mock('next/document', () => ({
  Html: ({ children }: { children: React.ReactNode }) => <div data-testid="html">{children}</div>,
  Head: () => null,
  Main: () => null,
  NextScript: () => null,
}));

describe('RootLayout', () => {
  it('renders children correctly', () => {
    render(
      <RootLayout>
        <div data-testid="test-child">Test Content</div>
      </RootLayout>
    );
    
    const child = screen.getByTestId('test-child');
    expect(child).toBeInTheDocument();
    expect(child).toHaveTextContent('Test Content');
  });

  it('has correct metadata', () => {
    const metadata = require('../layout').metadata;
    
    expect(metadata.title).toBe('Churnistic - Credit Card Churning Tracker');
    expect(metadata.description).toBe('Track and optimize your credit card churning strategy');
  });

  it('includes theme provider and css baseline', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );
    
    expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
    expect(screen.getByTestId('cache-provider')).toBeInTheDocument();
  });
}); 
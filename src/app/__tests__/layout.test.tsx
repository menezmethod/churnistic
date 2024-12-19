import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';

import RootLayout from '../layout';

// Mock the providers
jest.mock('@/theme/ClientThemeProvider', () => ({
  ClientThemeProvider: ({ children }: { children: React.ReactNode }): JSX.Element => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));

jest.mock('@/lib/auth/ClientAuthProvider', () => ({
  ClientAuthProvider: ({ children }: { children: React.ReactNode }): JSX.Element => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));

jest.mock('@mui/material-nextjs/v14-appRouter', () => ({
  AppRouterCacheProvider: ({ children }: { children: React.ReactNode }): JSX.Element => (
    <div data-testid="cache-provider">{children}</div>
  ),
}));

jest.mock('@mui/material/CssBaseline', () => ({
  __esModule: true,
  default: (): null => null,
}));

describe('RootLayout', () => {
  it('renders children within providers', () => {
    render(
      <RootLayout>
        <div data-testid="test-child">Test Child</div>
      </RootLayout>
    );

    expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
    expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
    expect(screen.getByTestId('cache-provider')).toBeInTheDocument();
    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import { ClientLayout } from '../ClientLayout';

// Mock Material-UI components and theme
jest.mock('@mui/material-nextjs/v14-appRouter', () => ({
  AppRouterCacheProvider: ({ children }: { children: React.ReactNode }): JSX.Element => <div>{children}</div>,
}));

jest.mock('@mui/material/styles', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }): JSX.Element => <div>{children}</div>,
  createTheme: (): Record<string, unknown> => ({}),
}));

jest.mock('@mui/material/CssBaseline', () => ({
  __esModule: true,
  default: (): null => null,
}));

// Mock theme
jest.mock('@/theme/theme', () => ({
  theme: {},
}));

describe('ClientLayout', () => {
  it('renders children correctly', () => {
    const testContent = 'Test Content';
    render(
      <ClientLayout>
        <div data-testid="test-child">{testContent}</div>
      </ClientLayout>
    );

    expect(screen.getByTestId('test-child')).toHaveTextContent(testContent);
  });
}); 
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ClientThemeProvider } from '../ClientThemeProvider';

// Mock the theme module
jest.mock('../theme', () => ({
  theme: {
    palette: {},
    typography: {},
    spacing: (): void => {},
    breakpoints: {
      up: (): void => {},
    },
  },
}));

// Mock the ThemeProvider component
jest.mock('@mui/material/styles', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }): JSX.Element => (
    <div>{children}</div>
  ),
}));

describe('ClientThemeProvider', () => {
  it('renders children with theme provider', (): void => {
    const testContent = <div data-testid="test-content">Test Content</div>;
    const { getByTestId } = render(
      <ClientThemeProvider>{testContent}</ClientThemeProvider>
    );

    expect(getByTestId('test-content')).toBeInTheDocument();
    expect(getByTestId('test-content')).toHaveTextContent('Test Content');
  });
});

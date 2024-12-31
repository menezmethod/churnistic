import { render as rtlRender, screen } from '@testing-library/react';

import RootLayout from '../layout';

// Custom render function for Next.js app router components
function render(ui: React.ReactElement<any>) {
  // Suppress validateDOMNesting warning for html and body tags
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('validateDOMNesting')) {
      return;
    }
    originalError.apply(console, args);
  };

  const result = rtlRender(ui);

  // Restore console.error
  console.error = originalError;

  return result;
}

jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'inter-mock',
  }),
}));

// Mock the client providers
jest.mock('../client-providers', () => ({
  ClientProviders: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="client-providers">{children}</div>
  ),
}));

// Mock the auth context
jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    isOffline: false,
    hasRole: () => false,
    hasPermission: () => false,
  }),
}));

// Mock the AppNavbar
jest.mock('@/components/AppNavbar', () => {
  return function MockAppNavbar() {
    return <nav data-testid="app-navbar">Mock Navbar</nav>;
  };
});

describe('RootLayout', () => {
  it('renders the basic structure correctly', () => {
    const testContent = 'Test Content';
    const { container } = render(
      <RootLayout>
        <div data-testid="test-content">{testContent}</div>
      </RootLayout>
    );

    // Check basic HTML structure
    const html = container.querySelector('html');
    expect(html).toHaveAttribute('lang', 'en');

    const body = container.querySelector('body');
    expect(body).toHaveClass('inter-mock');

    // Check if providers and components are rendered
    expect(screen.getByTestId('client-providers')).toBeInTheDocument();
    expect(screen.getByTestId('app-navbar')).toBeInTheDocument();

    // Check if main content is rendered
    expect(screen.getByTestId('test-content')).toHaveTextContent(testContent);

    // Check if main content wrapper exists with correct structure
    const mainContent = container.querySelector('main');
    expect(mainContent).toBeInTheDocument();
  });
});

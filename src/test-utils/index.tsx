import { render as rtlRender } from '@testing-library/react';
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { ReactElement } from 'react';

const createMockRouter = (
  router?: Partial<{
    back: () => void;
    forward: () => void;
    push: (url: string) => void;
    replace: (url: string) => void;
  }>
) => ({
  back: jest.fn(),
  forward: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
  ...router,
});

export function render(ui: ReactElement, { router = {}, ...options } = {}) {
  const mockRouter = createMockRouter(router);

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AppRouterContext.Provider value={mockRouter}>{children}</AppRouterContext.Provider>
    );
  }

  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

// Re-export everything
export * from '@testing-library/react';

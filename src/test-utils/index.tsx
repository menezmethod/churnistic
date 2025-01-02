import { screen, fireEvent, waitFor } from '@testing-library/dom';
import { render } from '@testing-library/react';
import { type ReactElement } from 'react';

interface RenderOptions {
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
}

function customRender(ui: ReactElement, options: RenderOptions = {}) {
  const { wrapper = ({ children }) => <>{children}</>, ...rest } = options;
  return render(ui, { wrapper, ...rest });
}

export * from '@testing-library/react';
export { customRender as render, screen, fireEvent, waitFor };

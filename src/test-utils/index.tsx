import { render } from '@testing-library/react';
import React from 'react';

// Custom render function for testing
const customRender = (ui: React.ReactElement, options = {}) =>
  render(ui, {
    wrapper: ({ children }) => children,
    ...options,
  });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };

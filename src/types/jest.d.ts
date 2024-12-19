/// <reference types="@testing-library/jest-dom" />

import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare global {
  namespace jest {
    interface Matchers<R = void> extends TestingLibraryMatchers<R, void> {
      toBeInTheDocument(): R;
    }

    interface Expect {
      any(constructor: unknown): unknown;
      anything(): unknown;
      objectContaining<T extends object>(obj: T): T;
    }
  }

  // Extend Chai assertions
  namespace Chai {
    interface Assertion extends TestingLibraryMatchers<unknown, void> {
      toBeInTheDocument(): Assertion;
      toHaveTextContent(text: string): Assertion;
      toHaveBeenCalledWith(...args: unknown[]): Assertion;
      toHaveBeenCalled(): Assertion;
      toBe(expected: unknown): Assertion;
      toEqual(expected: unknown): Assertion;
      toBeNull(): Assertion;
      toBeDefined(): Assertion;
      toContain(expected: string): Assertion;
      toHaveProperty(property: string): Assertion;
      toBeDisabled(): Assertion;
      toBeEnabled(): Assertion;
      toHaveClass(className: string): Assertion;
      toHaveValue(value: string | number): Assertion;
      toHaveAttribute(attr: string, value?: string): Assertion;
      toHaveStyle(style: Record<string, unknown>): Assertion;
    }
  }
}

export {};

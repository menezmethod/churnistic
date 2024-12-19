import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveTextContent(text: string): R;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toHaveBeenCalledWith(...args: any[]): R;
      toHaveBeenCalled(): R;
      toBe(expected: unknown): R;
      toEqual(expected: unknown): R;
      toBeNull(): R;
      toBeDefined(): R;
      toContain(expected: string): R;
      toHaveProperty(property: string): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toHaveClass(className: string): R;
      toHaveValue(value: string | number): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveStyle(style: Record<string, unknown>): R;
    }

    interface Expect extends jest.Matchers<void> {
      any(constructor: unknown): unknown;
      anything(): unknown;
    }
  }

  namespace Chai {
    interface Assertion {
      toBeInTheDocument(): void;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toHaveBeenCalledWith(...args: any[]): void;
      toHaveBeenCalled(): void;
      toHaveTextContent(text: string): void;
      toBe(expected: unknown): void;
      toEqual(expected: unknown): void;
      toBeNull(): void;
      toBeDefined(): void;
      toContain(expected: string): void;
      toHaveProperty(property: string): void;
      toBeDisabled(): void;
      toBeEnabled(): void;
      toHaveClass(className: string): void;
      toHaveValue(value: string | number): void;
      toHaveAttribute(attr: string, value?: string): void;
      toHaveStyle(style: Record<string, unknown>): void;
    }
  }
}

export {};

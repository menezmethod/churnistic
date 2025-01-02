/// <reference types="jest" />

declare module '@testing-library/jest-dom' {
  export {};
}

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveStyle(style: Record<string, string | number>): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toHaveClass(...classNames: string[]): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveTextContent(text: string | RegExp): R;
      toBeChecked(): R;
      toBeEmpty(): R;
      toBeEmptyDOMElement(): R;
      toBePartiallyChecked(): R;
      toBeRequired(): R;
      toBeValid(): R;
      toBeInvalid(): R;
      toHaveValue(value?: string | string[] | number): R;
      toHaveFocus(): R;
      toBeVisible(): R;
      toContainElement(element: HTMLElement | null): R;
      toContainHTML(htmlText: string): R;
      toHaveAccessibleDescription(text?: string | RegExp): R;
      toHaveAccessibleName(text?: string | RegExp): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveClass(...classNames: string[]): R;
      toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): R;
      toHaveErrorMessage(text?: string | RegExp): R;
      toHaveFormValues(values: Record<string, string | number | boolean>): R;
      toHaveStyle(css: string | Record<string, string | number>): R;
      toHaveTextContent(
        text: string | RegExp,
        options?: { normalizeWhitespace: boolean }
      ): R;
      toHaveValue(value?: string | string[] | number): R;
      toBeChecked(): R;
      toBePartiallyChecked(): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveClass(...classNames: string[]): R;
      toHaveStyle(css: string | Record<string, string | number>): R;
      toHaveTextContent(
        text: string | RegExp,
        options?: { normalizeWhitespace: boolean }
      ): R;
      toHaveValue(value?: string | string[] | number): R;
      toBeEmptyDOMElement(): R;
      toBeInTheDocument(): R;
      toBeVisible(): R;
      toBeRequired(): R;
      toBeValid(): R;
      toBeInvalid(): R;
      toHaveFocus(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeEmpty(): R;
      toBePartiallyChecked(): R;
      toHaveAccessibleDescription(text?: string | RegExp): R;
      toHaveAccessibleName(text?: string | RegExp): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveClass(...classNames: string[]): R;
      toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): R;
      toHaveErrorMessage(text?: string | RegExp): R;
      toHaveFormValues(values: Record<string, string | number | boolean>): R;
      toHaveStyle(css: string | Record<string, string | number>): R;
      toHaveTextContent(
        text: string | RegExp,
        options?: { normalizeWhitespace: boolean }
      ): R;
      toHaveValue(value?: string | string[] | number): R;
    }
  }
}

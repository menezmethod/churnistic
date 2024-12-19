/// <reference types="jest" />

declare module '@jest/expect' {
  interface Matchers<R> {
    toBeInTheDocument(): R;
    toBeEmptyDOMElement(): R;
    toHaveTextContent(text: string | RegExp): R;
  }
}

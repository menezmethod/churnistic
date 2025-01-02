import '@testing-library/jest-dom';

declare global {
  namespace jest {
    // @ts-expect-error -- T is used implicitly by Jest
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Matchers<T> {
      _dummy?: unknown;
    }
  }
}

export {};

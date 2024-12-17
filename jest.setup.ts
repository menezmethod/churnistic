import '@testing-library/jest-dom';
import { Response, Headers, Request } from 'node-fetch';

// Mock web APIs
Object.defineProperty(global, 'Response', {
  writable: true,
  value: Response,
});

Object.defineProperty(global, 'Headers', {
  writable: true,
  value: Headers,
});

Object.defineProperty(global, 'Request', {
  writable: true,
  value: Request,
});

// Mock Firebase
const mockAuth = {
  currentUser: null,
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback(null);
    return (): void => {};
  }),
};

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({
    name: '[DEFAULT]',
    options: {},
  })),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({
    name: '[DEFAULT]',
    options: {},
  })),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => mockAuth),
  onAuthStateChanged: jest.fn((auth, callback): (() => void) => {
    callback(null);
    return () => {};
  }),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});

// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]): void => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

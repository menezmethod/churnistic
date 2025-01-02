/* eslint-disable no-console */
import '@testing-library/jest-dom';
import type { Auth } from 'firebase/auth';
import { TextDecoder, TextEncoder } from 'util';

// Mock TextEncoder/TextDecoder for Node environment
global.TextEncoder = TextEncoder;
// @ts-expect-error: Node's TextDecoder is not fully compatible with the DOM's TextDecoder
global.TextDecoder = TextDecoder;

// Mock Firebase modules first
jest.mock('firebase/auth', () => {
  const mockUser = {
    uid: '123',
    email: 'test@example.com',
    getIdTokenResult: jest.fn(),
  };

  const mockCredential = {
    user: mockUser,
    providerId: null,
    operationType: 'signIn',
  };

  const mockAuth = {
    currentUser: null,
    signOut: jest.fn(),
  };

  return {
    getAuth: jest.fn(() => mockAuth),
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn().mockResolvedValue(mockCredential),
    signOut: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    GoogleAuthProvider: jest.fn(() => ({ providerId: 'google.com' })),
    GithubAuthProvider: jest.fn(() => ({ providerId: 'github.com' })),
    signInWithPopup: jest.fn().mockResolvedValue(mockCredential),
    connectAuthEmulator: jest.fn(),
  };
});

// Mock Firestore
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  connectFirestoreEmulator: jest.fn(),
}));

// Mock Storage
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  connectStorageEmulator: jest.fn(),
}));

// Mock Functions
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
  connectFunctionsEmulator: jest.fn(),
}));

// Mock console methods
const originalError = console.error;
const originalWarn = console.warn;
const originalInfo = console.info;
const originalLog = console.log;

// Create mock functions
export const mockUser = {
  uid: '123',
  email: 'test@example.com',
  getIdTokenResult: jest.fn(),
};

export const mockAuth: Partial<Auth> = {
  currentUser: null,
  signOut: jest.fn(),
};

type ConsoleArgs = Parameters<typeof console.error>;

// Setup console mocks
beforeAll((): void => {
  // eslint-disable-next-line no-console
  console.error = (...args: ConsoleArgs): void => {
    if (
      args[0]?.includes?.('Warning: ReactDOM.render is no longer supported') ||
      args[0]?.includes?.('Error: Uncaught [Error: expected]') ||
      args[0]?.includes?.('Database connection error:') ||
      args[0]?.includes?.('In HTML, <html> cannot be a child of <div>.')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  // eslint-disable-next-line no-console
  console.warn = (...args: ConsoleArgs): void => {
    if (args[0]?.includes?.('Warning:')) {
      return;
    }
    originalWarn.call(console, ...args);
  };

  // eslint-disable-next-line no-console
  console.info = (...args: ConsoleArgs): void => {
    if (args[0]?.includes?.('Firebase Admin initialized successfully')) {
      return;
    }
    originalInfo.call(console, ...args);
  };

  // eslint-disable-next-line no-console
  console.log = (...args: ConsoleArgs): void => {
    if (args[0]?.includes?.('Test log message')) {
      return;
    }
    originalLog.call(console, ...args);
  };
});

// Restore console methods
afterAll((): void => {
  // eslint-disable-next-line no-console
  console.error = originalError;
  // eslint-disable-next-line no-console
  console.warn = originalWarn;
  // eslint-disable-next-line no-console
  console.info = originalInfo;
  // eslint-disable-next-line no-console
  console.log = originalLog;
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
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

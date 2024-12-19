/// <reference types="node" />
import '@testing-library/jest-dom';

import { TextDecoder, TextEncoder } from 'util';

import { jest } from '@jest/globals';
import type {
  Auth,
  NextOrObserver,
  User,
  Unsubscribe,
  ErrorFn,
  CompleteFn,
} from 'firebase/auth';
import { Headers as NodeHeaders, Request as NodeRequest, Response } from 'node-fetch';

declare global {
  namespace NodeJS {
    interface Global {
      fetch: typeof fetch;
      Request: typeof NodeRequest;
      Response: typeof Response;
    }
  }
}

// Set up global fetch API
(global.fetch as unknown) = jest
  .fn()
  .mockImplementation((): Promise<Response> => Promise.resolve(new Response()));
(global.Request as unknown) = NodeRequest;
(global.Response as unknown) = Response;

// Mock web APIs
Object.defineProperty(global, 'Response', {
  writable: true,
  value: Response,
});

Object.defineProperty(global, 'Headers', {
  writable: true,
  value: NodeHeaders,
});

Object.defineProperty(global, 'Request', {
  writable: true,
  value: NodeRequest,
});

// Mock Firebase

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  getApp: jest.fn(),
}));

jest.mock('firebase/auth', () => {
  const mockAuth: Partial<Auth> = {
    currentUser: null,
    onAuthStateChanged: jest.fn(
      (
        nextOrObserver: NextOrObserver<User | null>,
        _error?: ErrorFn,
        _completed?: CompleteFn
      ): Unsubscribe => {
        if (typeof nextOrObserver === 'function') {
          nextOrObserver(null);
        }
        return jest.fn();
      }
    ),
  };

  return {
    getAuth: jest.fn(() => mockAuth),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(
      (
        nextOrObserver: NextOrObserver<User | null>,
        _error?: ErrorFn,
        _completed?: CompleteFn
      ): Unsubscribe => {
        if (typeof nextOrObserver === 'function') {
          nextOrObserver(null);
        }
        return jest.fn();
      }
    ),
    GoogleAuthProvider: jest.fn(() => ({
      addScope: jest.fn(),
    })),
    GithubAuthProvider: jest.fn(() => ({
      addScope: jest.fn(),
    })),
    signInWithPopup: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };
});

// Mock Firebase auth instance
jest.mock('@/lib/firebase/auth', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn((callback: NextOrObserver<User | null>): Unsubscribe => {
      if (typeof callback === 'function') {
        callback(null);
      }
      return jest.fn();
    }),
  },
  signInWithEmail: jest.fn(),
  signUpWithEmail: jest.fn(),
  signOut: jest.fn(),
  signInWithGoogle: jest.fn(),
  signInWithGithub: jest.fn(),
  resetPassword: jest.fn(),
  getCurrentUser: jest.fn(),
  onAuthStateChange: jest.fn(),
}));

// Mock Firebase Admin
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(() => ({
    name: '[DEFAULT]',
    options: {},
  })),
  getApps: jest.fn(() => []),
  cert: jest.fn(() => ({
    projectId: 'mock-project-id',
    clientEmail: 'mock-client-email',
    privateKey: 'mock-private-key',
  })),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn(() =>
      Promise.resolve({
        uid: 'mock-uid',
        email: 'mock@email.com',
      })
    ),
    createCustomToken: jest.fn(() => Promise.resolve('mock-custom-token')),
  })),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(
    (query: unknown): MediaQueryList => ({
      matches: false,
      media: query as string,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(() => true),
    })
  ),
});

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  takeRecords = (): IntersectionObserverEntry[] => [];
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver
class MockResizeObserver implements ResizeObserver {
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

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: (): Record<string, unknown> => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    query: {},
    pathname: '/',
    route: '/',
    asPath: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: (): Record<string, unknown> => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: (): string => '/',
  useSearchParams: (): URLSearchParams => new URLSearchParams(),
}));

// Mock environment variables
process.env = {
  ...process.env,
  NEXT_PUBLIC_FIREBASE_API_KEY: 'mock-api-key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'mock-auth-domain',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'mock-project-id',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'mock-storage-bucket',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: 'mock-sender-id',
  NEXT_PUBLIC_FIREBASE_APP_ID: 'mock-app-id',
  FIREBASE_ADMIN_CLIENT_EMAIL: 'mock-client-email',
  FIREBASE_ADMIN_PRIVATE_KEY: 'mock-private-key',
};

// Add missing Web APIs
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder as unknown as typeof global.TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;
}

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    bank: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    card: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  })),
}));

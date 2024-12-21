/// <reference types="node" />
import '@testing-library/jest-dom';
import React from 'react';

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
  initializeApp: jest.fn(() => ({
    name: '[DEFAULT]',
    options: {
      apiKey: 'test-api-key',
      authDomain: 'test-auth-domain',
      projectId: 'test-project-id',
      storageBucket: 'test-storage-bucket',
      messagingSenderId: 'test-messaging-sender-id',
      appId: 'test-app-id',
    },
  })),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({
    name: '[DEFAULT]',
    options: {
      apiKey: 'test-api-key',
      authDomain: 'test-auth-domain',
      projectId: 'test-project-id',
      storageBucket: 'test-storage-bucket',
      messagingSenderId: 'test-messaging-sender-id',
      appId: 'test-app-id',
    },
  })),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signInWithPopup: jest.fn(),
    signOut: jest.fn(),
  })),
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  GoogleAuthProvider: jest.fn(() => ({
    addScope: jest.fn(),
  })),
  GithubAuthProvider: jest.fn(() => ({
    addScope: jest.fn(),
  })),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
}));

// Mock next/link
jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({ children, href }: { children: React.ReactNode; href: string }) =>
      React.createElement('a', { href }, children),
  };
});

// Test accounts
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'qa.tester@churnistic.com',
  password: process.env.TEST_USER_PASSWORD || 'TestUser@2024',
  uid: 'test-user-uid',
};

const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || 'admin@churnistic.com',
  password: process.env.TEST_ADMIN_PASSWORD || 'AdminUser@2024',
  uid: 'admin-user-uid',
};

// Mock Firebase auth instance
jest.mock('@/lib/firebase/auth', () => {
  let currentUser: User | null = null;

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  const createAuthError = (code: string, message: string, originalError?: unknown) => ({
    code,
    message,
    originalError,
  });

  return {
    auth: {
      currentUser: null,
      onAuthStateChanged: jest.fn(
        (callback: NextOrObserver<User | null>): Unsubscribe => {
          if (typeof callback === 'function') {
            callback(currentUser);
          }
          return jest.fn();
        }
      ),
    },
    signInWithEmail: jest.fn(async (email: string, password: string) => {
      if (!email || !password) {
        return {
          user: null,
          error: createAuthError('auth/invalid-input', 'Email and password are required'),
        };
      }

      if (!validateEmail(email)) {
        return {
          user: null,
          error: createAuthError('auth/invalid-email-format', 'Invalid email format'),
        };
      }

      if (!validatePassword(password)) {
        return {
          user: null,
          error: createAuthError(
            'auth/weak-password',
            'Password should be at least 6 characters'
          ),
        };
      }

      // Check test accounts
      if (
        (email === TEST_USER.email && password === TEST_USER.password) ||
        (email === TEST_ADMIN.email && password === TEST_ADMIN.password)
      ) {
        const user = {
          uid: email === TEST_USER.email ? TEST_USER.uid : TEST_ADMIN.uid,
          email,
          emailVerified: true,
        } as User;
        currentUser = user;
        return { user, error: null };
      }

      return {
        user: null,
        error: createAuthError('auth/invalid-credential', 'Invalid email or password'),
      };
    }),
    signUpWithEmail: jest.fn(),
    signOut: jest.fn(async () => {
      currentUser = null;
      return { error: null };
    }),
    signInWithGoogle: jest.fn(),
    signInWithGithub: jest.fn(),
    resetPassword: jest.fn(async (email: string) => {
      if (!email) {
        return {
          error: createAuthError('auth/invalid-input', 'Email is required'),
        };
      }

      if (!validateEmail(email)) {
        return {
          error: createAuthError('auth/invalid-email-format', 'Invalid email format'),
        };
      }

      // Only allow password reset for test accounts
      if (email === TEST_USER.email || email === TEST_ADMIN.email) {
        return { error: null };
      }

      return {
        error: createAuthError('auth/user-not-found', 'No user found with this email'),
      };
    }),
    getCurrentUser: jest.fn(() => currentUser),
    onAuthStateChange: jest.fn((callback: (user: User | null) => void) => {
      callback(currentUser);
      return jest.fn();
    }),
  };
});

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

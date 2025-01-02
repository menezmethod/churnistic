/// <reference types="node" />
import '@testing-library/jest-dom';
import '@testing-library/react';
import { jest } from '@jest/globals';
import { TextDecoder, TextEncoder } from 'util';
import 'whatwg-fetch';

import { mockFirestore } from '@/mocks/firestore';

let NodeHeaders: typeof Headers;
let NodeRequest: typeof Request;
let NodeResponse: typeof Response;

// Mock Firebase auth
jest.mock('firebase/auth', () => {
  const mockAuth = {
    currentUser: null,
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
    emulatorConfig: null,
    config: {
      apiKey: 'mock-api-key',
      authDomain: 'mock-auth-domain',
      apiHost: 'identitytoolkit.googleapis.com',
      apiScheme: 'https',
      tokenApiHost: 'securetoken.googleapis.com',
      sdkClientVersion: 'mock-client-version',
    },
  };
  return {
    getAuth: jest.fn(() => mockAuth),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    GoogleAuthProvider: jest.fn(),
    connectAuthEmulator: jest.fn(),
    initializeAuth: jest.fn(() => mockAuth),
    inMemoryPersistence: jest.fn(),
    browserLocalPersistence: jest.fn(),
    browserSessionPersistence: jest.fn(),
  };
});

// Fix node-fetch import
let nodeFetch;
try {
  nodeFetch = require('node-fetch');
} catch (e) {
  nodeFetch = {
    Headers: class {},
    Request: class {},
    Response: class {
      private _body: string;
      private _init?: ResponseInit;

      constructor(body: string, init?: ResponseInit) {
        this._body = body;
        this._init = init;
      }

      json() {
        return Promise.resolve(JSON.parse(this._body));
      }
    },
  };
}

beforeAll(() => {
  NodeHeaders = nodeFetch.Headers;
  NodeRequest = nodeFetch.Request;
  NodeResponse = nodeFetch.Response;

  // Mock Firebase app initialization
  const mockApp = {
    name: '[DEFAULT]',
    options: {},
    automaticDataCollectionEnabled: false,
  };

  // Mock Firebase auth
  const mockAuth = {
    currentUser: null,
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn((callback: (user: null | { uid: string }) => void) => {
      callback(null);
      return () => {};
    }),
    emulatorConfig: null,
    config: {
      apiKey: 'mock-api-key',
      authDomain: 'mock-auth-domain',
      apiHost: 'identitytoolkit.googleapis.com',
      apiScheme: 'https',
      tokenApiHost: 'securetoken.googleapis.com',
      sdkClientVersion: 'mock-client-version',
    },
  };

  // Mock Firebase Firestore
  const mockFirestore = {
    collection: jest.fn(() => ({
      doc: jest.fn(),
      where: jest.fn(),
      orderBy: jest.fn(),
      limit: jest.fn(),
      get: jest.fn(),
    })),
    doc: jest.fn(),
  };

  // Mock Firebase app
  jest.mock('firebase/app', () => ({
    initializeApp: jest.fn(() => mockApp),
    getApps: jest.fn(() => [mockApp]),
    getApp: jest.fn(() => mockApp),
  }));

  // Mock Firebase auth
  jest.mock('firebase/auth', () => ({
    getAuth: jest.fn(() => mockAuth),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    GoogleAuthProvider: jest.fn(),
    connectAuthEmulator: jest.fn(),
    initializeAuth: jest.fn(() => mockAuth),
    inMemoryPersistence: jest.fn(),
    browserLocalPersistence: jest.fn(),
    browserSessionPersistence: jest.fn(),
  }));

  // Mock Firebase Firestore
  jest.mock('firebase/firestore', () => ({
    getFirestore: jest.fn(() => mockFirestore),
    connectFirestoreEmulator: jest.fn(),
    collection: jest.fn(),
    doc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    getDocs: jest.fn(),
    getDoc: jest.fn(),
  }));

  // Mock Firebase storage
  jest.mock('firebase/storage', () => ({
    getStorage: jest.fn(() => ({
      ref: jest.fn(),
    })),
    connectStorageEmulator: jest.fn(),
    ref: jest.fn(),
    uploadBytes: jest.fn(),
    getDownloadURL: jest.fn(),
  }));

  // Mock Firebase functions
  jest.mock('firebase/functions', () => ({
    getFunctions: jest.fn(() => ({
      httpsCallable: jest.fn(),
    })),
    connectFunctionsEmulator: jest.fn(),
    httpsCallable: jest.fn(),
  }));

  // Set up fetch mock with proper response structure
  global.fetch = jest.fn(() =>
    Promise.resolve(
      new NodeResponse(
        JSON.stringify({
          success: true,
          data: {
            opportunities: [
              {
                id: 'test-id',
                name: 'Test Bank Card',
                type: 'Credit Card',
                bonus: {
                  description: 'Test bonus description',
                  requirements: {
                    description: 'Spend $3000 in 3 months to get $500 bonus',
                  },
                },
                offer_link: 'https://test.com',
                metadata: {
                  created: new Date().toISOString(),
                  updated: new Date().toISOString(),
                },
                details: {
                  credit_inquiry: 'Hard Pull',
                  under_5_24: 'Yes',
                  annual_fees: '$95',
                  monthly_fees: '$0',
                  foreign_transaction_fees: '3%',
                  availability: {
                    type: 'Nationwide',
                  },
                },
              },
            ],
          },
        })
      )
    )
  );
  (global.Request as unknown) = NodeRequest;
  (global.Response as unknown) = NodeResponse;

  // Mock web APIs
  Object.defineProperty(global, 'Response', {
    writable: true,
    value: NodeResponse,
  });

  Object.defineProperty(global, 'Headers', {
    writable: true,
    value: NodeHeaders,
  });

  Object.defineProperty(global, 'Request', {
    writable: true,
    value: NodeRequest,
  });
});

declare global {
  interface Window {
    fetch: typeof fetch;
    Request: typeof Request;
    Response: typeof Response;
  }
}

declare module '@testing-library/jest-dom' {
  export interface Matchers<R> {
    toBeInTheDocument(): R;
    toHaveStyle(style: Record<string, unknown>): R;
  }
}

// Mock TextEncoder/TextDecoder
global.TextEncoder = TextEncoder as unknown as typeof global.TextEncoder;
global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;

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

// Mock Firebase Admin
jest.mock('@/lib/firebase/admin', () => ({
  db: mockFirestore,
  auth: {
    verifyIdToken: jest.fn(),
    getUser: jest.fn(),
    createCustomToken: jest.fn(),
    setCustomUserClaims: jest.fn(),
  },
}));

// Mock Firebase Client
jest.mock('firebase/app', () => {
  const mockApp = {
    name: '[DEFAULT]',
    options: {},
    automaticDataCollectionEnabled: false,
  };
  return {
    initializeApp: jest.fn(() => mockApp),
    getApps: jest.fn(() => [mockApp]),
    getApp: jest.fn(() => mockApp),
  };
});

jest.mock('firebase/auth', () => {
  const mockAuth = {
    currentUser: null,
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
    emulatorConfig: null,
    config: {
      apiKey: 'mock-api-key',
      authDomain: 'mock-auth-domain',
      apiHost: 'identitytoolkit.googleapis.com',
      apiScheme: 'https',
      tokenApiHost: 'securetoken.googleapis.com',
      sdkClientVersion: 'mock-client-version',
    },
  };
  return {
    getAuth: jest.fn(() => mockAuth),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    GoogleAuthProvider: jest.fn(),
    connectAuthEmulator: jest.fn(),
    initializeAuth: jest.fn(() => mockAuth),
    inMemoryPersistence: jest.fn(),
    browserLocalPersistence: jest.fn(),
    browserSessionPersistence: jest.fn(),
  };
});

jest.mock('firebase/firestore', () => {
  const mockFirestore = {
    collection: jest.fn(() => ({
      doc: jest.fn(),
      where: jest.fn(),
      orderBy: jest.fn(),
      limit: jest.fn(),
      get: jest.fn(),
    })),
    doc: jest.fn(),
  };
  return {
    getFirestore: jest.fn(() => mockFirestore),
    connectFirestoreEmulator: jest.fn(),
    collection: jest.fn(),
    doc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    getDocs: jest.fn(),
    getDoc: jest.fn(),
  };
});

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({
    ref: jest.fn(),
  })),
  connectStorageEmulator: jest.fn(),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({
    httpsCallable: jest.fn(),
  })),
  connectFunctionsEmulator: jest.fn(),
  httpsCallable: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
  (global.fetch as jest.Mock).mockClear();
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = jest.fn();
  disconnect = jest.fn();
  unobserve = jest.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
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
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: ReactDOM.render is no longer supported')
  ) {
    return;
  }
  originalError.call(console, ...args);
};

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

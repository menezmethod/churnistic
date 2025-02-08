/// <reference types="node" />

import { loadEnvConfig } from '@next/env';
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

import { mockFirestore } from '@/mocks/firestore';

// Load environment variables
loadEnvConfig(process.cwd());

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

// Mock window.ResizeObserver
class ResizeObserverMock {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

window.ResizeObserver = ResizeObserverMock;

// Mock window.IntersectionObserver
class IntersectionObserverMock implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '0px';
  readonly thresholds: ReadonlyArray<number> = [0];

  constructor(
    private callback: IntersectionObserverCallback,
    private options?: IntersectionObserverInit
  ) {}

  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn().mockReturnValue([]);
}

window.IntersectionObserver =
  IntersectionObserverMock as unknown as typeof window.IntersectionObserver;

// Mock fetch
global.fetch = jest.fn();

// Mock TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Clean up after each test
afterEach(() => {
  jest.resetAllMocks();
});

// Set up global fetch environment
global.fetch = global.fetch as unknown as typeof global.fetch;

// Mock Firestore
jest.mock('@firebase/firestore', () => ({
  ...jest.requireActual('@firebase/firestore'),
  getFirestore: () => mockFirestore,
}));

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  ...jest.requireActual('firebase/auth'),
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js image
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props: {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
    className?: string;
    priority?: boolean;
  }) {
    return {
      type: 'img',
      props: {
        ...props,
        alt: props.alt || '',
      },
    };
  },
}));

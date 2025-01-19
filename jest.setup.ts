/// <reference types="node" />
import '@testing-library/jest-dom';
import 'node-fetch';
import fetch from 'node-fetch';
import { TextEncoder, TextDecoder } from 'node:util';

Object.assign(global, {
  TextEncoder,
  TextDecoder,
});

import { mockFirestore } from '@/mocks/firestore';

// Set up global fetch environment
global.fetch = fetch as unknown as typeof global.fetch;

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

// Mock session service
jest.mock('@/lib/auth/services/session', () => ({
  verifySession: jest.fn(() =>
    Promise.resolve({
      uid: '123',
      email: 'test@example.com',
      role: 'admin',
      permissions: ['manage:system'],
      isSuperAdmin: false,
    })
  ),
  createSession: jest.fn(() => Promise.resolve('mock-session-cookie')),
  revokeSession: jest.fn(() => Promise.resolve()),
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

/// <reference types="node" />
import '@testing-library/jest-dom';
import fetch from 'node-fetch';

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

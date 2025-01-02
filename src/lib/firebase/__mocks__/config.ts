import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { Functions } from 'firebase/functions';
import { FirebaseStorage } from 'firebase/storage';

export const mockAuth = {
  currentUser: null,
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  app: {
    name: '[DEFAULT]',
    options: {},
  },
  name: 'mock-auth',
  config: {},
  setPersistence: jest.fn(),
} as unknown as Auth;

export const mockDb = {
  collection: jest.fn(),
  app: {
    name: '[DEFAULT]',
    options: {},
  },
  type: 'firestore',
  toJSON: () => ({}),
} as unknown as Firestore;

export const mockStorage = {
  app: {
    name: '[DEFAULT]',
    options: {},
  },
  maxUploadRetryTime: 0,
  maxOperationRetryTime: 0,
} as unknown as FirebaseStorage;

export const mockFunctions = {
  app: {
    name: '[DEFAULT]',
    options: {},
  },
} as unknown as Functions;

export const auth = mockAuth;
export const db = mockDb;
export const storage = mockStorage;
export const functions = mockFunctions;

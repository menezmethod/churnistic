import { Auth, User } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { Functions } from 'firebase/functions';
import { Storage } from 'firebase/storage';

const mockUser: User = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  refreshToken: 'test-refresh-token',
  tenantId: null,
  delete: jest.fn(),
  getIdToken: jest.fn(),
  getIdTokenResult: jest.fn(),
  reload: jest.fn(),
  toJSON: jest.fn(),
  phoneNumber: null,
  photoURL: null,
  providerId: 'password',
};

export const auth = {
  currentUser: mockUser,
  onAuthStateChanged: jest.fn((callback) => {
    callback(mockUser);
    return () => {};
  }),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
} as unknown as Auth;

export const db = {
  collection: jest.fn(),
  doc: jest.fn(),
} as unknown as Firestore;

export const functions = {
  httpsCallable: jest.fn(),
} as unknown as Functions;

export const storage = {
  ref: jest.fn(),
} as unknown as Storage;

export const onAuthStateChanged = auth.onAuthStateChanged;

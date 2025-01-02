/* eslint-disable @typescript-eslint/no-unused-vars */
import { Auth, User, UserCredential } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

// Mock user
export const mockUser: User = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  emailVerified: true,
  isAnonymous: false,
  metadata: {
    creationTime: '2024-01-01T00:00:00Z',
    lastSignInTime: '2024-01-01T00:00:00Z',
  },
  providerData: [],
  refreshToken: 'mock-refresh-token',
  tenantId: null,
  delete: jest.fn(),
  getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
  getIdTokenResult: jest.fn(),
  reload: jest.fn(),
  toJSON: jest.fn(),
  phoneNumber: null,
  providerId: 'password',
};

// Mock user credential
export const mockUserCredential: UserCredential = {
  user: mockUser,
  providerId: 'password',
  operationType: 'signIn',
};

// Mock auth instance
export const mockAuth: Auth = {
  app: {
    name: '[DEFAULT]',
    options: {},
    automaticDataCollectionEnabled: false,
  },
  name: '[DEFAULT]',
  config: {
    apiKey: 'mock-api-key',
    authDomain: 'mock-auth-domain',
    apiHost: 'identitytoolkit.googleapis.com',
    apiScheme: 'https',
    tokenApiHost: 'securetoken.googleapis.com',
    sdkClientVersion: 'mock-client-version',
  },
  currentUser: mockUser,
  languageCode: null,
  settings: {
    appVerificationDisabledForTesting: false,
  },
  tenantId: null,
  onAuthStateChanged: jest.fn((callback) => {
    if (typeof callback === 'function') {
      callback(mockUser);
    }
    return () => {};
  }),
  onIdTokenChanged: jest.fn(),
  beforeAuthStateChanged: jest.fn(),
  signOut: jest.fn().mockResolvedValue(undefined),
  updateCurrentUser: jest.fn(),
  useDeviceLanguage: jest.fn(),
  setPersistence: jest.fn(),
  authStateReady: jest.fn().mockResolvedValue(undefined),
  emulatorConfig: null,
};

// Mock Firestore instance
export const mockFirestore: Firestore = {
  app: {
    name: '[DEFAULT]',
    options: {},
    automaticDataCollectionEnabled: false,
  },
  type: 'firestore',
  toJSON: jest.fn(),
};

// Mock Firebase auth functions
export const mockSignInWithEmailAndPassword = jest
  .fn()
  .mockImplementation((auth, email, password) => {
    if (email === 'test@example.com' && password === 'password123') {
      return Promise.resolve(mockUserCredential);
    }
    throw { code: 'auth/wrong-password', message: 'Invalid credentials' };
  });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const mockSignInWithPopup = jest.fn().mockImplementation((_auth, _provider) => {
  return Promise.resolve(mockUserCredential);
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const mockCreateUserWithEmailAndPassword = jest
  .fn()
  .mockImplementation((_auth, _email, _password) => {
    return Promise.resolve(mockUserCredential);
  });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const mockSendPasswordResetEmail = jest.fn().mockImplementation((_auth, _email) => {
  return Promise.resolve();
});

export const mockGoogleAuthProvider = jest.fn().mockImplementation(() => ({
  setCustomParameters: jest.fn(),
}));

// Mock Firestore functions
export const mockCollection = jest.fn();
export const mockDoc = jest.fn();
export const mockGetDoc = jest.fn();
export const mockGetDocs = jest.fn();
export const mockQuery = jest.fn();
export const mockWhere = jest.fn();
export const mockOrderBy = jest.fn();
export const mockLimit = jest.fn();
export const mockAddDoc = jest.fn();
export const mockUpdateDoc = jest.fn();
export const mockDeleteDoc = jest.fn();

// Mock the entire firebase/auth module
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => mockAuth),
  signInWithEmailAndPassword: jest.fn((auth, email, password) =>
    mockSignInWithEmailAndPassword(auth, email, password)
  ),
  signInWithPopup: jest.fn((auth, provider) => mockSignInWithPopup(auth, provider)),
  createUserWithEmailAndPassword: jest.fn((auth, email, password) =>
    mockCreateUserWithEmailAndPassword(auth, email, password)
  ),
  sendPasswordResetEmail: jest.fn((auth, email) =>
    mockSendPasswordResetEmail(auth, email)
  ),
  GoogleAuthProvider: jest.fn(() => mockGoogleAuthProvider()),
  connectAuthEmulator: jest.fn(),
  initializeAuth: jest.fn(() => mockAuth),
  inMemoryPersistence: jest.fn(),
  browserLocalPersistence: jest.fn(),
  browserSessionPersistence: jest.fn(),
}));

// Mock the entire firebase/firestore module
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => mockFirestore),
  collection: mockCollection,
  doc: mockDoc,
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  query: mockQuery,
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  addDoc: mockAddDoc,
  updateDoc: mockUpdateDoc,
  deleteDoc: mockDeleteDoc,
  connectFirestoreEmulator: jest.fn(),
}));

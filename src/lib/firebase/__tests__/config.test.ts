import { FirebaseApp, getApps } from 'firebase/app';
import type { Auth } from 'firebase/auth';

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_FIREBASE_API_KEY: 'test-api-key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'test-project',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'test.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456789',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:123456789:web:abcdef',
};

// Store original process.env
const originalEnv = process.env;

// Mock Firebase app
const mockApp = {
  name: '[DEFAULT]',
  options: {},
} as FirebaseApp;

// Mock Firebase auth
const mockAuth = {
  currentUser: null,
  onAuthStateChanged: jest.fn(),
} as unknown as Auth;

// Mock Firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => mockApp),
  getApps: jest.fn(() => []),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => mockAuth),
}));

describe('Firebase Config', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    // Set up process.env for each test
    Object.keys(mockEnv).forEach(key => {
      process.env[key] = mockEnv[key as keyof typeof mockEnv];
    });
    // Reset getApps mock to return empty array by default
    (getApps as jest.Mock).mockReturnValue([]);
  });

  afterEach(() => {
    // Restore process.env
    process.env = originalEnv;
  });

  it('should initialize Firebase app with correct config when no app exists', async () => {
    // Import the config module
    const { app } = await import('../config');

    // Mock initializeApp before requiring config
    const mockInitializeApp = jest.fn(() => mockApp);
    jest.mock('firebase/app', () => ({
      initializeApp: mockInitializeApp,
      getApps: jest.fn(() => []),
    }));

    // Verify that initializeApp was called with the correct config
    expect(mockInitializeApp).toHaveBeenCalledWith(expect.objectContaining({
      apiKey: mockEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: mockEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: mockEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: mockEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: mockEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: mockEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
    }));
    expect(app).toBeDefined();
    expect(app).toEqual(mockApp);
  });

  it('should reuse existing Firebase app if one exists', async () => {
    // Mock getApps to return an existing app
    const mockGetApps = jest.fn(() => [mockApp]);
    jest.mock('firebase/app', () => ({
      initializeApp: jest.fn(() => mockApp),
      getApps: mockGetApps,
    }));

    // Import the config module
    const { app } = await import('../config');

    // Verify that getApps was called and app is reused
    expect(mockGetApps).toHaveBeenCalled();
    expect(app).toBeDefined();
    expect(app).toEqual(mockApp);
  });
}); 
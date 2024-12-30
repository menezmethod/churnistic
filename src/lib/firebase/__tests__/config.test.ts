import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  connectAuthEmulator: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  connectFirestoreEmulator: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(),
  connectStorageEmulator: jest.fn(),
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
  connectFunctionsEmulator: jest.fn(),
}));

describe('Firebase Config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes Firebase with correct config', async () => {
    // Import the module to trigger initialization
    await import('../../firebase/config');

    expect(initializeApp).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: expect.any(String),
        authDomain: expect.any(String),
        projectId: expect.any(String),
        storageBucket: expect.any(String),
        messagingSenderId: expect.any(String),
        appId: expect.any(String),
      })
    );
    expect(getAuth).toHaveBeenCalled();
    expect(getFirestore).toHaveBeenCalled();
    expect(getStorage).toHaveBeenCalled();
    expect(getFunctions).toHaveBeenCalled();
  });
});

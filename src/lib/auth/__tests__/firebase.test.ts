import { describe, expect, test, jest } from '@jest/globals';

// Mock Firebase app
const mockApp = {
  name: '[DEFAULT]',
  options: {},
};

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => mockApp),
}));

// Mock Firebase auth
const mockAuth = {
  currentUser: null,
};

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => mockAuth),
}));

describe('Firebase Auth', () => {
  test('auth is initialized', async () => {
    const { auth } = await import('../firebase');
    const { getAuth } = await import('firebase/auth');
    const { initializeApp } = await import('firebase/app');

    expect(auth).toBeDefined();
    expect(auth).toBe(mockAuth);
    expect(initializeApp).toHaveBeenCalledWith({
      apiKey: expect.any(String),
      authDomain: expect.any(String),
      projectId: expect.any(String),
      storageBucket: expect.any(String),
      messagingSenderId: expect.any(String),
      appId: expect.any(String),
    });
    expect(getAuth).toHaveBeenCalledWith(mockApp);
  });
});

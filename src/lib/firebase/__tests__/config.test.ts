import { describe, expect, test, jest } from '@jest/globals';

// Mock Firebase app
const mockApp = {
  name: '[DEFAULT]',
  options: {},
};

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => mockApp),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => mockApp),
}));

describe('Firebase Config', () => {
  test('initializes Firebase with correct config', async () => {
    const { initializeApp, getApps } = await import('firebase/app');
    await import('../config');

    expect(getApps).toHaveBeenCalled();
    expect(initializeApp).toHaveBeenCalledWith({
      apiKey: expect.any(String),
      authDomain: expect.any(String),
      projectId: expect.any(String),
      storageBucket: expect.any(String),
      messagingSenderId: expect.any(String),
      appId: expect.any(String),
    });
  });
});

import { initializeApp } from 'firebase/app';
import { describe, expect, test, jest } from '@jest/globals';

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({
    name: '[DEFAULT]',
    options: {},
  })),
}));

describe('Firebase Config', () => {
  test('initializes Firebase with correct config', () => {
    // Import the module that uses initializeApp
    require('../config');

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

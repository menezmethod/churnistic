import { describe, expect, jest, test, beforeEach } from '@jest/globals';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

import { mockFirebaseConfig } from '../../firebase/__mocks__/config';

jest.mock('firebase/app');
jest.mock('firebase/auth');

describe('Firebase Auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('auth is initialized', async () => {
    const mockApp = {
      name: '[DEFAULT]',
      options: mockFirebaseConfig,
    };

    const mockAuth = {
      currentUser: null,
      onAuthStateChanged: jest.fn(),
      signInWithEmailAndPassword: jest.fn(),
      signOut: jest.fn(),
    };

    (initializeApp as jest.Mock).mockReturnValue(mockApp);
    (getAuth as jest.Mock).mockReturnValue(mockAuth);

    // Import the module after mocking
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
  });
});

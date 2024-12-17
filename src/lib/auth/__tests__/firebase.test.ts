import { describe, expect, test, jest } from '@jest/globals';
import { auth } from '../firebase';
import { getAuth } from 'firebase/auth';
import { getApp } from 'firebase/app';

jest.mock('firebase/app', () => ({
  getApp: jest.fn(() => ({
    name: '[DEFAULT]',
    options: {},
  })),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
  })),
}));

describe('Firebase Auth', () => {
  test('auth is initialized', () => {
    expect(auth).toBeDefined();
    expect(getAuth).toHaveBeenCalled();
    expect(getApp).toHaveBeenCalled();
  });
});

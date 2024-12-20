import { describe, expect, it, beforeEach } from '@jest/globals';

import { signInWithEmail, signOut, resetPassword, getCurrentUser } from '../auth';

// Test accounts (using environment variables)
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || '',
  password: process.env.TEST_USER_PASSWORD || '',
};

const TEST_ADMIN = {
  email: process.env.TEST_ADMIN_EMAIL || '',
  password: process.env.TEST_ADMIN_PASSWORD || '',
};

// Validate test environment
if (
  !TEST_USER.email ||
  !TEST_USER.password ||
  !TEST_ADMIN.email ||
  !TEST_ADMIN.password
) {
  throw new Error('Test environment variables are not properly configured');
}

describe('Firebase Auth Tests', () => {
  beforeEach(async () => {
    // Sign out before each test to ensure clean state
    await signOut();
  });

  describe('signInWithEmail', () => {
    it('successfully signs in with test user credentials', async () => {
      const response = await signInWithEmail(TEST_USER.email, TEST_USER.password);
      expect(response.error).toBeNull();
      expect(response.user).not.toBeNull();
      expect(response.user?.email).toBe(TEST_USER.email);
    });

    it('successfully signs in with admin credentials', async () => {
      const response = await signInWithEmail(TEST_ADMIN.email, TEST_ADMIN.password);
      expect(response.error).toBeNull();
      expect(response.user).not.toBeNull();
      expect(response.user?.email).toBe(TEST_ADMIN.email);
    });

    it('fails to sign in with invalid credentials', async () => {
      const response = await signInWithEmail('invalid@email.com', 'wrongpassword');
      expect(response.error).not.toBeNull();
      expect(response.user).toBeNull();
      expect(response.error?.code).toBe('auth/invalid-credential');
    });

    it('validates email format', async () => {
      const response = await signInWithEmail('invalid-email', TEST_USER.password);
      expect(response.error).not.toBeNull();
      expect(response.user).toBeNull();
      expect(response.error?.code).toBe('auth/invalid-email-format');
    });

    it('validates password length', async () => {
      const response = await signInWithEmail(TEST_USER.email, '12345');
      expect(response.error).not.toBeNull();
      expect(response.user).toBeNull();
      expect(response.error?.code).toBe('auth/weak-password');
    });

    it('validates required fields', async () => {
      const response = await signInWithEmail('', '');
      expect(response.error).not.toBeNull();
      expect(response.user).toBeNull();
      expect(response.error?.code).toBe('auth/invalid-input');
    });
  });

  describe('getCurrentUser', () => {
    it('returns null when no user is signed in', async () => {
      await signOut();
      const user = getCurrentUser();
      expect(user).toBeNull();
    });

    it('returns user object when signed in', async () => {
      await signInWithEmail(TEST_USER.email, TEST_USER.password);
      const user = getCurrentUser();
      expect(user).not.toBeNull();
      expect(user?.email).toBe(TEST_USER.email);
    });
  });

  describe('signOut', () => {
    it('successfully signs out user', async () => {
      // First sign in
      await signInWithEmail(TEST_USER.email, TEST_USER.password);
      expect(getCurrentUser()).not.toBeNull();

      // Then sign out
      const response = await signOut();
      expect(response.error).toBeNull();
      expect(getCurrentUser()).toBeNull();
    });
  });

  describe('resetPassword', () => {
    it('handles reset password request for existing user', async () => {
      const response = await resetPassword(TEST_USER.email);
      expect(response.error).toBeNull();
    });

    it('handles reset password request for non-existent user', async () => {
      const response = await resetPassword('nonexistent@example.com');
      expect(response.error).not.toBeNull();
      expect(response.error?.code).toBe('auth/user-not-found');
    });

    it('validates email format for password reset', async () => {
      const response = await resetPassword('invalid-email');
      expect(response.error).not.toBeNull();
      expect(response.error?.code).toBe('auth/invalid-email-format');
    });

    it('validates required email', async () => {
      const response = await resetPassword('');
      expect(response.error).not.toBeNull();
      expect(response.error?.code).toBe('auth/invalid-input');
    });
  });
});

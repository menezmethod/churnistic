import { User } from 'firebase/auth';

import { FirebaseAuthError } from '@/lib/errors/firebase';

import { shouldUseEmulators } from './environment';

/**
 * Manages the session cookie and user claims
 * @param user Firebase User instance
 * @throws FirebaseAuthError if session management fails
 */
export async function manageSessionCookie(user: User): Promise<void> {
  try {
    // Get the ID token with force refresh
    const idToken = await user.getIdToken(true);
    const idTokenResult = await user.getIdTokenResult(true);

    // Add claims to the user object
    Object.defineProperty(user, 'customClaims', {
      value: {
        role: idTokenResult.claims.role,
        permissions: idTokenResult.claims.permissions,
      },
      writable: true,
      configurable: true,
    });

    // Set session cookie
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to set session cookie');
    }

    // Set a local cookie for the emulator environment
    if (shouldUseEmulators()) {
      document.cookie = `session=${idToken}; path=/; max-age=3600; SameSite=Strict`;
    }
  } catch (error) {
    throw new FirebaseAuthError(
      'auth/session-management-failed',
      'Failed to manage session',
      error
    );
  }
}

/**
 * Clears the session cookie
 * @throws FirebaseAuthError if session clearing fails
 */
export async function clearSessionCookie(): Promise<void> {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to clear session cookie');
    }

    // Clear local cookie in emulator environment
    if (shouldUseEmulators()) {
      document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  } catch (error) {
    throw new FirebaseAuthError(
      'auth/session-clear-failed',
      'Failed to clear session',
      error
    );
  }
}

/**
 * Gets the current session token
 * @returns Session token string or null if not found
 */
export function getSessionToken(): string | null {
  const cookies = document.cookie.split(';');
  const sessionCookie = cookies.find((cookie) => cookie.trim().startsWith('session='));
  return sessionCookie ? sessionCookie.split('=')[1] : null;
}

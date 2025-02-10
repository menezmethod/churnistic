import { getIdToken } from 'firebase/auth';
import type { User } from 'firebase/auth';

import { FirebaseAuthError } from '@/lib/errors/firebase';

import { shouldUseEmulators } from './environment';

/**
 * Manages the session cookie and user claims
 * @param user Firebase User instance
 * @throws FirebaseAuthError if session management fails
 */
export async function manageSessionCookie(user: User): Promise<void> {
  try {
    const idToken = await getIdToken(user, true);
    await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });
  } catch (error) {
    console.error('Failed to manage session cookie:', error);
    throw error;
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

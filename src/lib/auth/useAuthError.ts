import { FirebaseError } from 'firebase/app';
import { useCallback } from 'react';

export function useAuthError() {
  const getErrorMessage = useCallback((error: unknown): string => {
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case 'auth/invalid-email':
          return 'Invalid email address';
        case 'auth/user-disabled':
          return 'This account has been disabled';
        case 'auth/user-not-found':
          return 'No account found with this email';
        case 'auth/wrong-password':
          return 'Invalid password';
        case 'auth/email-already-in-use':
          return 'An account already exists with this email';
        case 'auth/weak-password':
          return 'Password should be at least 6 characters';
        case 'auth/popup-closed-by-user':
          return 'Sign in was cancelled';
        case 'auth/operation-not-allowed':
          return 'Operation not allowed';
        case 'auth/network-request-failed':
          return 'Network error. Please check your connection';
        case 'auth/too-many-requests':
          return 'Too many attempts. Please try again later';
        default:
          return error.message;
      }
    }
    return 'An unexpected error occurred';
  }, []);

  return { getErrorMessage };
}

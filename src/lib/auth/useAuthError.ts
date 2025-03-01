import { AuthError } from '@supabase/supabase-js';
import { useCallback } from 'react';

export function useAuthError() {
  const getErrorMessage = useCallback((error: unknown): string => {
    if (error instanceof AuthError) {
      switch (error.message) {
        case 'Invalid login credentials':
          return 'Invalid email or password';
        case 'Email not confirmed':
          return 'Please verify your email address';
        case 'User already registered':
          return 'An account already exists with this email';
        case 'Password should be at least 6 characters':
          return 'Password should be at least 6 characters';
        case 'Invalid email':
          return 'Invalid email address';
        case 'Email rate limit exceeded':
          return 'Too many attempts. Please try again later';
        case 'Network error':
          return 'Network error. Please check your connection';
        default:
          return error.message;
      }
    }
    return 'An unexpected error occurred';
  }, []);

  return { getErrorMessage };
}

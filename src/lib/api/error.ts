import { AuthError } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export type APIErrorResponse = {
  error: string;
  code?: string;
  status: number;
};

export class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

interface FirebaseErrorLike {
  code?: string;
  message?: string;
}

/**
 * Formats an error into a consistent API error response
 * @param error Error to format
 * @returns Formatted error response
 */
export function formatError(error: unknown): APIErrorResponse {
  if (error instanceof APIError) {
    return {
      error: error.message,
      code: error.code,
      details: error.details,
      status: error.status,
    };
  }

  if (error instanceof ZodError) {
    return {
      error: 'Validation error',
      code: 'validation_error',
      details: error.errors,
      status: 400,
    };
  }

  // Handle Firebase errors
  const firebaseError = error as FirebaseErrorLike;
  if (firebaseError?.code?.startsWith('auth/')) {
    return {
      error: firebaseError.message || 'Authentication error',
      code: firebaseError.code,
      status: 401,
    };
  }

  if (firebaseError?.code?.startsWith('permission-denied')) {
    return {
      error: firebaseError.message || 'Permission denied',
      code: firebaseError.code,
      status: 403,
    };
  }

  if (firebaseError?.code?.startsWith('not-found')) {
    return {
      error: firebaseError.message || 'Resource not found',
      code: firebaseError.code,
      status: 404,
    };
  }

  // Handle Supabase auth errors
  if (error instanceof AuthError) {
    return {
      error: error.message,
      code: error.status.toString(),
      status: error.status,
    };
  }

  // Handle database errors
  if (error instanceof Error && 'code' in error) {
    const dbError = error as Error & { code: string };
    if (dbError.code === 'PGRST301') {
      return {
        error: 'Resource not found',
        code: dbError.code,
        status: 404,
      };
    }
    if (dbError.code === 'PGRST403') {
      return {
        error: 'Permission denied',
        code: dbError.code,
        status: 403,
      };
    }
  }

  // Handle validation errors
  if (error instanceof Error && error.name === 'ValidationError') {
    return {
      error: error.message,
      code: 'validation_error',
      status: 400,
    };
  }

  // Handle generic errors
  if (error instanceof Error) {
    return {
      error: error.message,
      status: 500,
    };
  }

  return {
    error: 'An unexpected error occurred',
    status: 500,
  };
}

/**
 * Creates a NextResponse with error details
 * @param error Error to handle
 * @returns NextResponse with error details
 */
export function handleAPIError(error: unknown): APIErrorResponse {
  console.error('API Error:', error);

  // Handle Supabase auth errors
  if (error instanceof AuthError) {
    return {
      error: error.message,
      code: error.status.toString(),
      status: error.status,
    };
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return {
      error: 'Validation error',
      code: 'validation_error',
      status: 400,
      details: error.errors,
    };
  }

  // Handle database errors
  if (error instanceof Error && 'code' in error) {
    const dbError = error as Error & { code: string };
    if (dbError.code === 'PGRST301') {
      return {
        error: 'Resource not found',
        code: dbError.code,
        status: 404,
      };
    }
    if (dbError.code === 'PGRST403') {
      return {
        error: 'Permission denied',
        code: dbError.code,
        status: 403,
      };
    }
  }

  // Handle generic errors
  if (error instanceof Error) {
    return {
      error: error.message,
      status: 500,
    };
  }

  return {
    error: 'An unexpected error occurred',
    status: 500,
  };
}

/**
 * Creates a NextResponse with error details
 * @param error Error to handle
 * @returns NextResponse with error details
 */
export function createErrorResponse(error: APIErrorResponse): NextResponse {
  return NextResponse.json(error, { status: error.status });
}

/**
 * Wraps an API route handler with error handling
 * @param handler API route handler to wrap
 * @returns Wrapped handler with error handling
 */
export function withErrorHandling(
  handler: (req: Request, ...args: unknown[]) => Promise<Response>
) {
  return async (req: Request, ...args: unknown[]): Promise<Response> => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      return handleAPIError(error);
    }
  };
}

/**
 * Creates common API errors
 */
export const APIErrors = {
  unauthorized: (message = 'Unauthorized') => new APIError(message, 'unauthorized', 401),

  forbidden: (message = 'Forbidden') => new APIError(message, 'forbidden', 403),

  notFound: (message = 'Not found') => new APIError(message, 'not_found', 404),

  badRequest: (message = 'Bad request') => new APIError(message, 'bad_request', 400),

  methodNotAllowed: (message = 'Method not allowed') =>
    new APIError(message, 'method_not_allowed', 405),

  tooManyRequests: (message = 'Too many requests') =>
    new APIError(message, 'too_many_requests', 429),

  internal: (message = 'Internal server error') =>
    new APIError(message, 'internal_server_error', 500),
};

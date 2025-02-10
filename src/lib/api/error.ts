import { AuthError } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export type APIErrorResponse = {
  error: string;
  code: string;
  details?: unknown;
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

  if (error instanceof AuthError) {
    return {
      error: error.message,
      code: String(error.status ?? 'auth_error'),
      status: error.status ?? 401,
    };
  }

  // Default error response
  console.error('Unhandled API error:', error);
  return {
    error: 'Internal server error',
    code: 'internal_server_error',
    status: 500,
  };
}

/**
 * Creates a NextResponse with error details
 * @param error Error to handle
 * @returns NextResponse with error details
 */
export function handleAPIError(error: unknown): NextResponse {
  const errorResponse = formatError(error);
  return NextResponse.json(errorResponse, { status: errorResponse.status });
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

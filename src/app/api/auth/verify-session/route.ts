import { NextRequest, NextResponse } from 'next/server';

import { verifySessionCookie } from '@/lib/auth/session';

// Define response types for better type safety
type SuccessResponse = {
  uid: string;
  email: string;
  emailVerified: boolean;
  role: string;
  username?: string;
};

type ErrorResponse = {
  error: string;
};

/**
 * Verifies the session cookie and returns the user data if valid
 * This endpoint is used by both client-side code and middleware
 *
 * @param request - The Next.js request object
 * @returns A JSON response with the user data or error
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    // Directly get the session cookie value from the request
    const sessionCookie = request.cookies.get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'No session cookie' }, { status: 401 });
    }

    // Verify the session cookie
    const userData = await verifySessionCookie(sessionCookie);

    if (!userData) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Return the user data with proper type handling
    // Making sure we handle potential undefined values
    const email = userData.email || '';
    const emailVerified = userData.email_verified || false;

    return NextResponse.json({
      uid: userData.uid,
      email,
      emailVerified,
      role: userData.role || 'user',
      username: userData.username,
    } as SuccessResponse);
  } catch (error) {
    console.error(
      'Session verification error:',
      error instanceof Error ? error.message : String(error)
    );

    return NextResponse.json({ error: 'Session verification failed' }, { status: 401 });
  }
}

/**
 * POST method for backward compatibility and client-side usage
 * Allows verifying a session token passed in the request body
 *
 * @param request - The Next.js request object
 * @returns A JSON response indicating whether the session is valid
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<{ valid: boolean } | ErrorResponse>> {
  try {
    const body = await request.json();
    const { sessionCookie } = body;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Missing session cookie' }, { status: 400 });
    }

    // Verify the session
    const userData = await verifySessionCookie(sessionCookie);

    return NextResponse.json({ valid: Boolean(userData) });
  } catch (error) {
    console.error(
      'Session verification error:',
      error instanceof Error ? error.message : String(error)
    );

    return NextResponse.json({ valid: false }, { status: 401 });
  }
}

/**
 * Handles preflight requests for the verify-session endpoint
 * Necessary for cross-origin requests
 *
 * @returns A response with the appropriate CORS headers
 */
export function OPTIONS(): NextResponse {
  return NextResponse.json(
    {},
    {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    }
  );
}

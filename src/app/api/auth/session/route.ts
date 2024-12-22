import { type NextRequest, NextResponse } from 'next/server';

import { verifySession } from '@/lib/auth/session';
import { getAdminAuth } from '@/lib/firebase/admin-app';
import { type FirebaseError } from '@/types';

const SESSION_COOKIE_NAME = 'session';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  sameSite: 'lax' as const,
};

const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

export async function POST(request: NextRequest) {
  try {
    console.log('Session API - Received POST request');

    // Log environment variables (safely)
    console.log('Session API - Environment check:', {
      useEmulators: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true',
      hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      nodeEnv: process.env.NODE_ENV,
    });

    let body;
    try {
      body = await request.json();
      console.log('Session API - Request body parsed:', {
        idToken: body.idToken ? `${body.idToken.substring(0, 10)}...` : 'missing',
        bodyKeys: Object.keys(body),
      });
    } catch (parseError) {
      console.error('Session API - Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body', details: 'Could not parse JSON body' },
        { status: 400 }
      );
    }

    const { idToken } = body;
    if (!idToken) {
      console.error('Session API - No ID token provided in request');
      return NextResponse.json(
        {
          error: 'No ID token provided',
          details: 'ID token is required in request body',
        },
        { status: 400 }
      );
    }

    console.log('Session API - Initializing admin auth');
    let auth;
    try {
      auth = getAdminAuth();
      console.log('Session API - Admin auth initialized successfully');
    } catch (error) {
      const adminError = error as FirebaseError;
      console.error('Session API - Failed to initialize admin auth:', {
        error: adminError.message,
        code: adminError.code,
        stack: adminError.stack,
      });
      return NextResponse.json(
        {
          error: 'Firebase admin initialization failed',
          details: adminError.message || 'Could not initialize Firebase Admin',
        },
        { status: 500 }
      );
    }

    try {
      // Verify the ID token first
      console.log('Session API - Verifying ID token');
      const decodedToken = await auth.verifyIdToken(idToken);
      console.log('Session API - ID token verified successfully:', {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
      });

      const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
      let sessionCookie;

      if (useEmulators) {
        console.log(
          'Session API - Using emulator mode, using ID token as session cookie'
        );
        // In emulator mode, use the ID token directly
        sessionCookie = idToken;
      } else {
        console.log('Session API - Creating session cookie');
        try {
          sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
          console.log('Session API - Session cookie created successfully');
        } catch (error) {
          const cookieError = error as FirebaseError;
          console.error('Session API - Failed to create session cookie:', {
            error: cookieError.message,
            code: cookieError.code,
            stack: cookieError.stack,
          });
          return NextResponse.json(
            {
              error: 'Failed to create session cookie',
              details: cookieError.message || 'Could not create session cookie',
            },
            { status: 401 }
          );
        }
      }

      // Create the response with the session cookie
      const response = NextResponse.json({
        status: 'success',
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          emailVerified: decodedToken.email_verified,
          role: decodedToken.role || 'user',
        },
      });

      // Set the cookie in the response
      response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
        ...COOKIE_OPTIONS,
        maxAge: expiresIn / 1000,
      });

      console.log('Session API - Response prepared successfully');
      return response;
    } catch (error) {
      const authError = error as FirebaseError;
      console.error('Session API - Authentication error:', {
        name: authError.name,
        message: authError.message,
        stack: authError.stack,
        code: authError.code,
      });

      return NextResponse.json(
        {
          error: 'Authentication failed',
          details: authError.message || 'Failed to authenticate user',
        },
        { status: 401 }
      );
    }
  } catch (error) {
    const serverError = error as Error;
    console.error('Session API - Unexpected error:', {
      name: serverError.name,
      message: serverError.message,
      stack: serverError.stack,
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: serverError.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const sessionData = await verifySession(sessionCookie);
    if (!sessionData) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        uid: sessionData.uid,
        email: sessionData.email,
        role: sessionData.role || 'user',
        emailVerified: sessionData.email_verified,
        displayName: sessionData.name,
        photoURL: sessionData.picture,
      },
    });
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json({ user: null }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ status: 'success' });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

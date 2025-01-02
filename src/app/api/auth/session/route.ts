import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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

// Validation schemas
const sessionRequestSchema = z.object({
  idToken: z.string().min(1, 'ID token is required'),
});

interface SessionUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  role: string;
  displayName?: string | null;
  photoURL?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: {
            message: 'Invalid request body',
            details: 'Could not parse JSON body',
          },
        },
        { status: 400 }
      );
    }

    try {
      const { idToken } = sessionRequestSchema.parse(body);
      const auth = getAdminAuth();
      const decodedToken = await auth.verifyIdToken(idToken);

      const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
      const sessionCookie = useEmulators
        ? idToken // In emulator mode, use the ID token directly
        : await auth.createSessionCookie(idToken, { expiresIn });

      const user: SessionUser = {
        uid: decodedToken.uid,
        email: decodedToken.email ?? null,
        emailVerified: decodedToken.email_verified ?? false,
        role: decodedToken.role || 'user',
      };

      const response = NextResponse.json({
        data: { user },
      });

      response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
        ...COOKIE_OPTIONS,
        maxAge: expiresIn / 1000,
      });

      return response;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: {
              message: 'Invalid request data',
              details: error.errors,
            },
          },
          { status: 400 }
        );
      }

      const authError = error as FirebaseError;
      return NextResponse.json(
        {
          error: {
            message: 'Authentication failed',
            details: authError.message || 'Failed to authenticate user',
          },
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Session API - Unexpected error:', error);
    return NextResponse.json(
      {
        error: {
          message: 'Internal server error',
          details:
            error instanceof Error ? error.message : 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        {
          error: {
            message: 'No session found',
            details: 'Session cookie is missing',
          },
        },
        { status: 401 }
      );
    }

    const sessionData = await verifySession(sessionCookie);
    if (!sessionData) {
      return NextResponse.json(
        {
          error: {
            message: 'Invalid session',
            details: 'Session could not be verified',
          },
        },
        { status: 401 }
      );
    }

    const user: SessionUser = {
      uid: sessionData.uid,
      email: sessionData.email ?? null,
      role: sessionData.role || 'user',
      emailVerified: sessionData.email_verified ?? false,
      displayName: sessionData.name,
      photoURL: sessionData.picture,
    };

    return NextResponse.json({
      data: { user },
    });
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json(
      {
        error: {
          message: 'Session verification failed',
          details:
            error instanceof Error ? error.message : 'An unexpected error occurred',
        },
      },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    data: { success: true },
  });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

export const dynamic = 'force-dynamic';

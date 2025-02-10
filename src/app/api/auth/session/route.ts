import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { getAdminApp } from '@/lib/firebase/admin';

const COOKIE_NAME = 'session';
const MAX_AGE = 60 * 60 * 24 * 5; // 5 days

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
    }

    const auth = getAuth(getAdminApp());

    // Verify the ID token first
    const decodedIdToken = await auth.verifyIdToken(idToken);

    // Only process if the token is valid
    if (new Date().getTime() / 1000 - decodedIdToken.auth_time > 5 * 60) {
      return NextResponse.json({ error: 'Recent sign in required' }, { status: 401 });
    }

    // Create session cookie
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: MAX_AGE * 1000,
    });

    const cookieStore = await cookies();

    // Set cookie
    cookieStore.set(COOKIE_NAME, sessionCookie, {
      maxAge: MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    // Return the user data
    return NextResponse.json({
      uid: decodedIdToken.uid,
      email: decodedIdToken.email,
      emailVerified: decodedIdToken.email_verified,
    });
  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return NextResponse.json(null);
    }

    const auth = getAuth(getAdminApp());

    // Check session with checkRevoked true
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

    return NextResponse.json({
      uid: decodedClaims.uid,
      email: decodedClaims.email,
      emailVerified: decodedClaims.email_verified,
    });
  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json(null);
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  return NextResponse.json({ status: 'success' });
}

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { getAdminAuth } from '@/lib/firebase/admin';

const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    // In emulator mode, skip token verification
    if (useEmulator) {
      const cookieStore = await cookies();
      await cookieStore.set('session', idToken, {
        maxAge: 60 * 60 * 24 * 5, // 5 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      return NextResponse.json({ status: 'success' });
    }

    // Get admin auth instance
    const auth = getAdminAuth();
    const expiresIn = 432000 * 1000; // 5 days in milliseconds

    // Create session cookie (only in production)
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn / 1000, // Convert to seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      {
        error: 'Failed to create session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';

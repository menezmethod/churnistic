import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { getAdminAuth } from '@/lib/firebase/admin';
import { getSessionCookieOptions } from '@/lib/firebase/config';

export async function POST(request: Request) {
  try {
    const { idToken, origin } = await request.json();
    const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

    // Validate ID token first
    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'Invalid ID token format' }, { status: 400 });
    }

    // Handle emulator mode
    if (useEmulator) {
      console.log('🔧 Using emulator mode for session creation');
      const cookieStore = await cookies();
      const options = getSessionCookieOptions();
      cookieStore.set('session', idToken, options);
      return NextResponse.json({ status: 'success', mode: 'emulator' });
    }

    // Production mode handling
    const auth = getAdminAuth();
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: 60 * 60 * 24 * 5 * 1000,
    });

    const domain = getDomain(origin || request.headers.get('host') || '');
    const cookieStore = await cookies();
    const options = getSessionCookieOptions();
    cookieStore.set('session', sessionCookie, options);

    return NextResponse.json({ status: 'success', mode: 'production', domain });
  } catch (error) {
    console.error('Full session creation error:', error);
    return NextResponse.json(
      {
        error: 'Authentication failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper function to get the appropriate cookie domain
function getDomain(host: string): string | undefined {
  console.log('Getting cookie domain for host:', host);

  // Strip protocol if present
  const domain = host.replace(/^https?:\/\//, '').split(':')[0];

  // For localhost or Vercel preview URLs, return undefined to let the browser handle it
  if (domain.includes('localhost') || domain.includes('vercel.app')) {
    console.log(
      'Development/Preview environment detected, using default domain handling'
    );
    return undefined;
  }

  // For production domain
  if (domain.includes('churnistic.com')) {
    console.log('Production domain detected');
    return 'churnistic.com';
  }

  // Default case - return undefined to let the browser handle it
  console.log('Using browser default domain handling');
  return undefined;
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

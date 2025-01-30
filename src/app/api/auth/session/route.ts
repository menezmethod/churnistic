import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { getAdminAuth } from '@/lib/firebase/admin';
import { getSessionCookieOptions } from '@/lib/firebase/config';

const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

export async function POST(request: Request) {
  try {
    const { idToken, origin } = await request.json();
    console.log('Session API called:', {
      hasToken: !!idToken,
      origin,
      useEmulator,
      headers: Object.fromEntries(request.headers),
    });

    // In emulator mode, skip token verification
    if (useEmulator) {
      console.log('Setting emulator mode session cookie');
      const cookieStore = await cookies();
      cookieStore.set({
        value: idToken,
        ...getSessionCookieOptions(),
      });
      return NextResponse.json({ status: 'success', mode: 'emulator' });
    }

    // Get admin auth instance
    const auth = getAdminAuth();
    const expiresIn = 432000 * 1000; // 5 days in milliseconds

    // Create session cookie
    console.log('Creating production session cookie');
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    // Set cookie
    const domain = getDomain(origin || request.headers.get('host') || '');
    console.log('Setting cookie with domain:', domain);

    const cookieStore = await cookies();
    cookieStore.set({
      value: sessionCookie,
      ...getSessionCookieOptions(),
    });

    return NextResponse.json({
      status: 'success',
      mode: 'production',
      domain,
    });
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

// Helper function to get the appropriate cookie domain
function getDomain(host: string): string | undefined {
  console.log('Getting cookie domain for host:', host);

  // Strip protocol if present
  const domain = host.replace(/^https?:\/\//, '');

  // For localhost, return undefined to let the browser handle it
  if (domain.includes('localhost')) {
    console.log('Localhost detected, using default domain');
    return undefined;
  }

  // For Vercel preview URLs
  if (domain.includes('vercel.app')) {
    console.log('Vercel preview domain detected');
    return domain;
  }

  // For production domain
  if (domain.includes('churnistic.com')) {
    console.log('Production domain detected');
    return 'churnistic.com';
  }

  // Default case
  console.log('Using provided domain as is');
  return domain;
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

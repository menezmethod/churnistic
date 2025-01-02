import { type inferAsyncReturnType } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { type NextRequest, type NextResponse } from 'next/server';

import { verifySession } from '@/lib/auth/session';
import { type Session } from '@/lib/auth/types';
import { db } from '@/lib/firebase/admin';

export type CreateContextOptions = {
  session: Session | null;
  req?: CreateNextContextOptions['req'] | NextRequest;
  res?: CreateNextContextOptions['res'] | NextResponse;
  user?: Session;
};

export async function createContext(opts: CreateContextOptions | NextRequest) {
  // For App Router
  if ('cookies' in opts) {
    // Handle NextRequest
    const req = opts;
    const sessionCookie = req.cookies.get('session')?.value;
    const session = sessionCookie ? await verifySession(sessionCookie) : null;

    // Add debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Context creation:', {
        hasSessionCookie: !!sessionCookie,
        sessionVerified: !!session,
        useEmulators: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true',
      });
    }

    return {
      session,
      db,
      req,
      user: session,
    };
  }

  // For Pages Router and API Routes
  const { session, req, res } = opts as CreateContextOptions;
  return {
    session,
    db,
    req,
    res,
    user: session,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;

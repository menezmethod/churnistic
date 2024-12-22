import { type inferAsyncReturnType } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { type NextRequest, type NextResponse } from 'next/server';

import { type Session } from '@/lib/auth/types';
import { prisma } from '@/lib/prisma';

export type CreateContextOptions = {
  session: Session | null;
  prisma: typeof prisma;
  req?: CreateNextContextOptions['req'] | NextRequest;
  res?: CreateNextContextOptions['res'] | NextResponse;
  user?: Session;
};

export async function createContext(opts: CreateContextOptions | NextRequest) {
  // For App Router
  if ('cookies' in opts) {
    // Handle NextRequest
    const req = opts;
    // Here you would get the session from the request
    const session = null; // Implement your session retrieval logic
    return {
      session,
      prisma,
      req,
      user: session,
    };
  }

  // For Pages Router and API Routes
  const { session, req, res } = opts as CreateContextOptions;
  return {
    session,
    prisma,
    req,
    res,
    user: session,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;

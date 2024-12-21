import { PrismaClient } from '@prisma/client';
import { DecodedIdToken } from 'firebase-admin/auth';
import { NextRequest } from 'next/server';

import { createAuthContext } from '@/lib/auth/authUtils';
import { prisma } from '@/lib/prisma/db';

export interface Context {
  user: DecodedIdToken | null;
  prisma: PrismaClient;
  session?: {
    uid: string;
  };
}

export interface CreateContextOptions {
  session: DecodedIdToken | null;
  prisma: typeof prisma;
}

export async function createContext(req: NextRequest): Promise<Context> {
  try {
    const authContext = await createAuthContext(req);
    const decodedToken = authContext.session
      ? ({
          uid: authContext.session.uid,
          email: authContext.session.email,
          aud: 'default',
          auth_time: Date.now(),
          exp: Date.now() + 3600,
          iat: Date.now(),
          iss: 'https://securetoken.google.com/default',
          sub: authContext.session.uid,
          firebase: {
            identities: {},
            sign_in_provider: 'custom',
          },
        } as DecodedIdToken)
      : null;

    return {
      user: decodedToken,
      session: decodedToken
        ? {
            uid: decodedToken.uid,
          }
        : undefined,
      prisma,
    };
  } catch {
    // Return null session for any auth errors
    return {
      user: null,
      session: undefined,
      prisma,
    };
  }
}

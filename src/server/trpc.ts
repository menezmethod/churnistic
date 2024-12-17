import { initTRPC } from '@trpc/server';
import { type NextRequest } from 'next/server';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { prisma } from '@/lib/prisma/db';
import { initAdmin } from '@/lib/firebase/admin';

// Initialize Firebase Admin
initAdmin();

// Context type definition
export interface CreateContextOptions {
  session: DecodedIdToken | null;
  prisma: typeof prisma;
}

interface ContextOptions {
  req: NextRequest;
}

export async function createContext({ req }: ContextOptions): Promise<CreateContextOptions> {
  const session = req.headers.get('authorization')
    ? await getAuth()
        .verifyIdToken(req.headers.get('authorization')!.replace('Bearer ', ''))
        .catch(() => null)
    : null;

  return {
    session,
    prisma,
  };
}

const t = initTRPC.context<CreateContextOptions>().create();

// Base router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure
export const protectedProcedure = t.procedure.use(
  t.middleware(({ ctx, next }) => {
    if (!ctx.session) {
      throw new Error('UNAUTHORIZED');
    }
    return next({
      ctx: {
        ...ctx,
        session: ctx.session,
      },
    });
  })
);

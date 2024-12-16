import { initTRPC } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { getAuth } from 'firebase-admin/auth';
import { prisma } from '@/lib/prisma/db';
import { initAdmin } from '@/lib/firebase/admin';

// Initialize Firebase Admin
initAdmin();

// Context type definition
export interface CreateContextOptions {
  session: any | null;
  prisma: typeof prisma;
}

export async function createContext({ req }: CreateNextContextOptions) {
  const session = req.headers.authorization
    ? await getAuth()
        .verifyIdToken(req.headers.authorization.replace('Bearer ', ''))
        .catch(() => null)
    : null;

  return {
    session,
    prisma,
  };
}

const t = initTRPC.context<typeof createContext>().create();

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
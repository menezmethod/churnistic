import { initTRPC, TRPCError } from '@trpc/server';
import { OpenApiMeta } from 'trpc-openapi';

import { UserRole } from '@/types/roles';
import { type Session } from '@/types/session';

import { type Context, type ContextWithSession } from './context';

const t = initTRPC.context<Context>().meta<OpenApiMeta>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Not authenticated',
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    } as ContextWithSession,
  });
});

const isAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Not authenticated',
    });
  }

  const session = ctx.session as Session;
  if (session.role !== UserRole.ADMIN) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Not authorized. Admin access required.',
    });
  }

  return next({
    ctx: {
      ...ctx,
      session,
    } as ContextWithSession,
  });
});

export const protectedProcedure = t.procedure.use(isAuthed);
export const adminProcedure = t.procedure.use(isAdmin);

import { initTRPC } from '@trpc/server';
import { OpenApiMeta } from 'trpc-openapi';

import { Context } from './context';

const t = initTRPC.context<Context>().meta<OpenApiMeta>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(
  t.middleware(({ ctx, next }) => {
    if (!ctx.session) {
      throw new Error('Not authenticated');
    }
    return next({
      ctx: {
        ...ctx,
        session: ctx.session,
      },
    });
  })
);

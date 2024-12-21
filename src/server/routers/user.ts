import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { router, protectedProcedure } from '../trpc';

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to access this resource',
      });
    }

    const user = await ctx.prisma.user.findUnique({
      where: { firebaseUid: ctx.session.uid },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return user;
  }),

  update: protectedProcedure
    .input(
      z.object({
        displayName: z.string().optional(),
        email: z.string().email().optional(),
        photoURL: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to access this resource',
        });
      }

      const user = await ctx.prisma.user.update({
        where: { firebaseUid: ctx.session.uid },
        data: input,
      });

      return user;
    }),

  delete: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to access this resource',
      });
    }

    await ctx.prisma.user.delete({
      where: { firebaseUid: ctx.session.uid },
    });

    return { success: true };
  }),
});

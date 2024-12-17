import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { router, protectedProcedure, publicProcedure } from '../trpc';

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
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

  create: publicProcedure
    .input(
      z.object({
        firebaseUid: z.string(),
        email: z.string().email(),
        displayName: z.string().optional(),
        photoURL: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.create({
        data: input,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        displayName: z.string().optional(),
        photoURL: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.user.update({
        where: { firebaseUid: ctx.session.uid },
        data: input,
      });
    }),

  delete: protectedProcedure.mutation(async ({ ctx }) => {
    return ctx.prisma.user.delete({
      where: { firebaseUid: ctx.session.uid },
    });
  }),
});

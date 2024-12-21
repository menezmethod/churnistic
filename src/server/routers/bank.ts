import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { router, protectedProcedure } from '../trpc';

export const bankRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to access this resource',
      });
    }

    return ctx.prisma.bank.findMany();
  }),

  getById: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to access this resource',
      });
    }

    const bank = await ctx.prisma.bank.findUnique({
      where: { id: input },
    });

    if (!bank) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Bank not found',
      });
    }

    return bank;
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        website: z.string().url().optional(),
        logo: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to access this resource',
        });
      }

      return ctx.prisma.bank.create({
        data: input,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        website: z.string().url().optional(),
        logo: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to access this resource',
        });
      }

      const { id, ...data } = input;

      return ctx.prisma.bank.update({
        where: { id },
        data,
      });
    }),

  delete: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to access this resource',
      });
    }

    return ctx.prisma.bank.delete({
      where: { id: input },
    });
  }),
});

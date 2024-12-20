import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { router, protectedProcedure } from '../trpc';

export const companyRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.company.findMany();
  }),

  getById: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    const company = await ctx.prisma.company.findUnique({
      where: { id: input },
    });

    if (!company) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Company not found',
      });
    }

    return company;
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        industry: z.string().optional(),
        size: z.string().optional(),
        website: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.company.create({
        data: input,
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        industry: z.string().optional(),
        size: z.string().optional(),
        website: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.company.update({
        where: { id },
        data,
      });
    }),

  delete: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    return ctx.prisma.company.delete({
      where: { id: input },
    });
  }),
});

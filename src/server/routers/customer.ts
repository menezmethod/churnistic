import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { router, protectedProcedure } from '../trpc';

const CustomerStatus = z.enum(['active', 'at_risk', 'churned']);

export const customerRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to access this resource',
      });
    }

    return ctx.prisma.customer.findMany();
  }),

  getById: protectedProcedure.input(z.string()).query(async ({ ctx, input }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to access this resource',
      });
    }

    const customer = await ctx.prisma.customer.findUnique({
      where: { id: input },
    });

    if (!customer) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Customer not found',
      });
    }

    return customer;
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
        companyId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to access this resource',
        });
      }

      return ctx.prisma.customer.create({
        data: {
          ...input,
          status: 'active',
          lastActive: new Date(),
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        companyId: z.string().optional(),
        status: CustomerStatus.optional(),
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

      return ctx.prisma.customer.update({
        where: { id },
        data: {
          ...data,
          lastActive: new Date(),
        },
      });
    }),

  delete: protectedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to access this resource',
      });
    }

    return ctx.prisma.customer.delete({
      where: { id: input },
    });
  }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: CustomerStatus,
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.customer.update({
        where: { id: input.id },
        data: {
          status: input.status,
          lastActive: new Date(),
          ...(input.status === 'churned' && { churnedAt: new Date() }),
        },
      });
    }),
});

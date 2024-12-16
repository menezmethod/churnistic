import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

const CustomerStatus = z.enum(['active', 'at_risk', 'churned']);

export const customerRouter = router({
  getAll: protectedProcedure
    .input(
      z.object({
        companyId: z.string(),
        status: CustomerStatus.optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.customer.findMany({
        where: {
          companyId: input.companyId,
          ...(input.status && { status: input.status }),
        },
      });
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
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
        companyId: z.string(),
        email: z.string().email(),
        name: z.string().optional(),
        status: CustomerStatus.default('active'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.customer.create({
        data: {
          ...input,
          lastActive: new Date(),
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        email: z.string().email().optional(),
        name: z.string().optional(),
        status: CustomerStatus.optional(),
        lastActive: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.customer.update({
        where: { id },
        data: {
          ...data,
          ...(data.status === 'churned' && { churnedAt: new Date() }),
        },
      });
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
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
          ...(input.status === 'churned' && { churnedAt: new Date() }),
        },
      });
    }),
}); 
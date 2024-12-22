import { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { UserRole } from '@/lib/auth/types';

import { router, protectedProcedure } from '../trpc';

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      });
    }

    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.uid },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return user;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.role || ctx.session.role !== UserRole.ADMIN) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authorized',
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: input.id },
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
        id: z.string(),
        displayName: z.string().optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      // Check if user exists
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.id },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Check if user is authorized to update
      if (ctx.session.uid !== input.id && ctx.session.role !== UserRole.ADMIN) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authorized',
        });
      }

      const updatedUser = await ctx.prisma.user.update({
        where: { id: input.id },
        data: {
          displayName: input.displayName,
          email: input.email,
        },
      });

      return updatedUser;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session?.role || ctx.session.role !== UserRole.ADMIN) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authorized',
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: input.id },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return ctx.prisma.user.delete({
        where: { id: input.id },
      });
    }),

  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().optional(),
          offset: z.number().optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.session?.role || ctx.session.role !== UserRole.ADMIN) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authorized',
        });
      }

      const where: Prisma.UserWhereInput | undefined = input?.search
        ? {
            OR: [
              { displayName: { contains: input.search, mode: 'insensitive' } },
              { email: { contains: input.search, mode: 'insensitive' } },
            ],
          }
        : undefined;

      return ctx.prisma.user.findMany({
        ...(input?.limit && { take: input.limit }),
        ...(input?.offset && { skip: input.offset }),
        ...(where && { where }),
      });
    }),
});

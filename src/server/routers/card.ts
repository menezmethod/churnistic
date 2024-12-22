import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { cardApplicationSchema, retentionOfferSchema } from '../schemas/card';
import { protectedProcedure, router } from '../trpc';

export const cardRouter = router({
  apply: protectedProcedure
    .input(cardApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      const { prisma, user } = ctx;

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to apply for a card',
        });
      }

      return prisma.cardApplication.create({
        data: {
          ...input,
          userId: user.uid,
          status: 'PENDING',
        },
      });
    }),

  getApplications: protectedProcedure.query(async ({ ctx }) => {
    const { prisma, user } = ctx;

    if (!user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to view applications',
      });
    }

    return prisma.cardApplication.findMany({
      where: {
        userId: user.uid,
      },
      include: {
        card: true,
        retentionOffers: true,
      },
    });
  }),

  submitRetentionOffer: protectedProcedure
    .input(retentionOfferSchema)
    .mutation(async ({ ctx, input }) => {
      const { prisma, user } = ctx;

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to submit a retention offer',
        });
      }

      const application = await prisma.cardApplication.findUnique({
        where: {
          id: input.applicationId,
        },
      });

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found',
        });
      }

      if (application.userId !== user.uid) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only submit retention offers for your own applications',
        });
      }

      return prisma.retentionOffer.create({
        data: {
          ...input,
          cardId: application.cardId,
        },
      });
    }),

  updateApplication: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma, user } = ctx;

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to update an application',
        });
      }

      const application = await prisma.cardApplication.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!application) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found',
        });
      }

      if (application.userId !== user.uid) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update your own applications',
        });
      }

      return prisma.cardApplication.update({
        where: {
          id: input.id,
        },
        data: {
          status: input.status,
          notes: input.notes,
        },
      });
    }),
});

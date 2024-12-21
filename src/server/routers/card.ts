import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { CardStatus } from '@/types/card';

import { router, protectedProcedure } from '../trpc';

// Input validation schemas
const cardApplicationSchema = z.object({
  cardId: z.string(),
  creditScore: z.number().optional(),
  income: z.number().optional(),
  notes: z.string().optional(),
});

export const cardRouter = router({
  // Apply for a new card
  apply: protectedProcedure
    .input(cardApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to access this resource',
        });
      }

      // Check if user is eligible for the card
      const card = await ctx.prisma.card.findUnique({
        where: { id: input.cardId },
        include: {
          issuerRules: true,
        },
      });

      if (!card) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Card not found',
        });
      }

      // Check credit score requirement
      if (
        card.creditScoreMin &&
        input.creditScore &&
        input.creditScore < card.creditScoreMin
      ) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Credit score too low',
        });
      }

      // Check issuer rules
      for (const rule of card.issuerRules) {
        if (!rule.isActive) {
          continue;
        }

        if (rule.maxCards) {
          const activeCards = await ctx.prisma.cardApplication.count({
            where: {
              userId: ctx.session.uid,
              card: {
                issuerId: card.issuerId,
              },
              status: {
                in: [CardStatus.APPROVED, CardStatus.PENDING],
              },
            },
          });

          if (activeCards >= rule.maxCards) {
            return {
              success: false,
              error: {
                code: 'MAX_CARDS_EXCEEDED',
                message: `Maximum of ${rule.maxCards} cards allowed from issuer`,
                details: {
                  maxCards: rule.maxCards,
                  issuer: card.issuerId,
                },
              },
            };
          }
        }

        if (rule.cooldownPeriod) {
          const recentApplication = await ctx.prisma.cardApplication.findFirst({
            where: {
              userId: ctx.session.uid,
              card: {
                issuerId: card.issuerId,
              },
              appliedAt: {
                gte: new Date(Date.now() - rule.cooldownPeriod * 24 * 60 * 60 * 1000),
              },
            },
          });

          if (recentApplication) {
            return {
              success: false,
              error: {
                code: 'COOLDOWN_PERIOD',
                message: 'Cooldown period not met',
                details: {
                  cooldownPeriod: rule.cooldownPeriod,
                  issuer: card.issuerId,
                },
              },
            };
          }
        }
      }

      return ctx.prisma.cardApplication.create({
        data: {
          userId: ctx.session.uid,
          cardId: input.cardId,
          status: CardStatus.PENDING,
          notes: input.notes,
          appliedAt: new Date(),
          spendProgress: 0,
          annualFeePaid: false,
        },
      });
    }),

  // Update application status
  updateStatus: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
        status: z.nativeEnum(CardStatus),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to access this resource',
        });
      }

      const application = await ctx.prisma.cardApplication.findUnique({
        where: { id: input.applicationId },
      });

      if (!application || application.userId !== ctx.session.uid) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found',
        });
      }

      return ctx.prisma.cardApplication.update({
        where: { id: input.applicationId },
        data: {
          status: input.status,
          approvedAt: input.status === CardStatus.APPROVED ? new Date() : undefined,
          closedAt: input.status === CardStatus.CANCELLED ? new Date() : undefined,
          notes: input.notes,
        },
      });
    }),

  // Add retention offer
  addRetentionOffer: protectedProcedure
    .input(
      z
        .object({
          applicationId: z.string(),
          pointsOffered: z
            .number()
            .positive('Points offered must be positive')
            .optional(),
          statementCredit: z
            .number()
            .positive('Statement credit must be positive')
            .optional(),
          spendRequired: z
            .number()
            .positive('Spend requirement must be positive')
            .optional(),
          notes: z.string().optional(),
        })
        .refine(
          (data) =>
            data.pointsOffered !== undefined || data.statementCredit !== undefined,
          {
            message: 'Must specify either points or statement credit',
          }
        )
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to access this resource',
        });
      }

      const application = await ctx.prisma.cardApplication.findUnique({
        where: { id: input.applicationId },
      });

      if (!application || application.userId !== ctx.session.uid) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found',
        });
      }

      return ctx.prisma.retentionOffer.create({
        data: {
          applicationId: input.applicationId,
          cardId: application.cardId,
          pointsOffered: input.pointsOffered,
          statementCredit: input.statementCredit,
          spendRequired: input.spendRequired,
          notes: input.notes,
        },
      });
    }),

  // Get user's card applications
  getApplications: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to access this resource',
        });
      }

      const applications = await ctx.prisma.cardApplication.findMany({
        where: {
          userId: ctx.session.uid,
        },
        include: {
          card: true,
        },
        orderBy: {
          appliedAt: 'desc',
        },
        take: input.limit || 10,
      });

      return {
        items: applications,
        total: await ctx.prisma.cardApplication.count({
          where: {
            userId: ctx.session.uid,
          },
        }),
      };
    }),

  // Check card eligibility
  checkEligibility: protectedProcedure
    .input(
      z.object({
        cardId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.session) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to access this resource',
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

      const card = await ctx.prisma.card.findUnique({
        where: { id: input.cardId },
        include: {
          issuerRules: true,
        },
      });

      if (!card) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Card not found',
        });
      }

      // Check credit score requirement
      if (
        card.creditScoreMin &&
        user.creditScore &&
        user.creditScore < card.creditScoreMin
      ) {
        return {
          eligible: false,
          reason: 'Credit score too low',
        };
      }

      // Check issuer rules
      for (const rule of card.issuerRules) {
        if (!rule.isActive) {
          continue;
        }

        if (rule.maxCards) {
          const activeCards = await ctx.prisma.cardApplication.count({
            where: {
              userId: ctx.session.uid,
              card: {
                issuerId: card.issuerId,
              },
              status: {
                in: [CardStatus.APPROVED, CardStatus.PENDING],
              },
            },
          });

          if (activeCards >= rule.maxCards) {
            return {
              eligible: false,
              reason: `Maximum of ${rule.maxCards} cards allowed from issuer`,
            };
          }
        }

        if (rule.cooldownPeriod) {
          const recentApplication = await ctx.prisma.cardApplication.findFirst({
            where: {
              userId: ctx.session.uid,
              card: {
                issuerId: card.issuerId,
              },
              appliedAt: {
                gte: new Date(Date.now() - rule.cooldownPeriod * 24 * 60 * 60 * 1000),
              },
            },
          });

          if (recentApplication) {
            return {
              eligible: false,
              reason: 'Cooldown period not met',
            };
          }
        }
      }

      return {
        eligible: true,
      };
    }),
});

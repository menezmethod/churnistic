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

const retentionOfferSchema = z.object({
  applicationId: z.string(),
  pointsOffered: z.number().optional(),
  statementCredit: z.number().optional(),
  spendRequired: z.number().optional(),
  notes: z.string().optional(),
});

export const cardRouter = router({
  // Apply for a new card
  apply: protectedProcedure.input(cardApplicationSchema).mutation(async ({ ctx, input }) => {
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
    if (card.creditScoreMin && input.creditScore && input.creditScore < card.creditScoreMin) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Credit score too low',
      });
    }

    // Check issuer rules
    for (const rule of card.issuerRules) {
      if (!rule.isActive) {continue;}

      if (rule.maxCards) {
        const activeCards = await ctx.prisma.cardApplication.count({
          where: {
            userId: ctx.session.uid,
            card: {
              issuer: card.issuer,
            },
            status: {
              in: [CardStatus.APPROVED, CardStatus.PENDING],
            },
          },
        });

        if (activeCards >= rule.maxCards) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Maximum of ${rule.maxCards} cards allowed from ${card.issuer}`,
          });
        }
      }

      if (rule.cooldownPeriod) {
        const recentApplication = await ctx.prisma.cardApplication.findFirst({
          where: {
            userId: ctx.session.uid,
            card: {
              issuer: card.issuer,
            },
            appliedAt: {
              gte: new Date(Date.now() - rule.cooldownPeriod * 24 * 60 * 60 * 1000),
            },
          },
        });

        if (recentApplication) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Must wait ${rule.cooldownPeriod} days between applications`,
          });
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
    .input(retentionOfferSchema)
    .mutation(async ({ ctx, input }) => {
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
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const applications = await ctx.prisma.cardApplication.findMany({
        where: {
          userId: ctx.session.uid,
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        include: {
          card: true,
          retentionOffers: true,
        },
        orderBy: {
          appliedAt: 'desc',
        },
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (applications.length > input.limit) {
        const nextItem = applications.pop();
        if (nextItem) {
          nextCursor = nextItem.id;
        }
      }

      return {
        items: applications,
        nextCursor,
      };
    }),

  // Check card eligibility
  checkEligibility: protectedProcedure
    .input(
      z.object({
        cardId: z.string(),
        creditScore: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
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

      const violations = [];

      // Check credit score
      if (card.creditScoreMin && input.creditScore && input.creditScore < card.creditScoreMin) {
        violations.push({
          rule: 'Credit Score',
          message: `Minimum credit score required: ${card.creditScoreMin}`,
        });
      }

      // Check issuer rules
      for (const rule of card.issuerRules) {
        if (!rule.isActive) {continue;}

        if (rule.maxCards) {
          const activeCards = await ctx.prisma.cardApplication.count({
            where: {
              userId: ctx.session.uid,
              card: {
                issuer: card.issuer,
              },
              status: {
                in: [CardStatus.APPROVED, CardStatus.PENDING],
              },
            },
          });

          if (activeCards >= rule.maxCards) {
            violations.push({
              rule: 'Maximum Cards',
              message: `Maximum of ${rule.maxCards} cards allowed from ${card.issuer}`,
            });
          }
        }

        if (rule.cooldownPeriod) {
          const recentApplication = await ctx.prisma.cardApplication.findFirst({
            where: {
              userId: ctx.session.uid,
              card: {
                issuer: card.issuer,
              },
              appliedAt: {
                gte: new Date(Date.now() - rule.cooldownPeriod * 24 * 60 * 60 * 1000),
              },
            },
          });

          if (recentApplication) {
            violations.push({
              rule: 'Application Cooldown',
              message: `Must wait ${rule.cooldownPeriod} days between applications`,
            });
          }
        }
      }

      return {
        eligible: violations.length === 0,
        violations,
      };
    }),

  // Apply for card
  applyForCard: protectedProcedure
    .input(
      z.object({
        cardId: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const card = await ctx.prisma.card.findUnique({
        where: { id: input.cardId },
      });

      if (!card) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Card not found',
        });
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

  // Update spend progress
  updateSpend: protectedProcedure
    .input(
      z.object({
        applicationId: z.string(),
        amount: z.number(),
        date: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const application = await ctx.prisma.cardApplication.findUnique({
        where: { id: input.applicationId },
        include: {
          card: true,
        },
      });

      if (!application || application.userId !== ctx.session.uid) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found',
        });
      }

      if (application.status !== CardStatus.APPROVED) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot track spend for non-approved applications',
        });
      }

      if (application.spendDeadline && input.date > application.spendDeadline) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Spend date is after bonus deadline',
        });
      }

      const newSpendProgress = application.spendProgress + input.amount;
      const shouldEarnBonus =
        !application.bonusEarnedAt &&
        newSpendProgress >= application.card.minSpend &&
        (!application.spendDeadline || input.date <= application.spendDeadline);

      return ctx.prisma.cardApplication.update({
        where: { id: input.applicationId },
        data: {
          spendProgress: newSpendProgress,
          bonusEarnedAt: shouldEarnBonus ? input.date : application.bonusEarnedAt,
        },
      });
    }),
});

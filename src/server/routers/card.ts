import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { CardStatus, type RuleViolation, type EligibilityCheck } from '@/types/card';

// Input validation schemas
const CardApplicationInput = z.object({
  cardId: z.string(),
  creditScore: z.number().optional(),
  income: z.number().optional(),
  notes: z.string().optional(),
});

const SpendUpdateInput = z.object({
  applicationId: z.string(),
  amount: z.number(),
  date: z.date(),
});

const RetentionOfferInput = z.object({
  applicationId: z.string(),
  pointsOffered: z.number().optional(),
  statementCredit: z.number().optional(),
  spendRequired: z.number().optional(),
  notes: z.string().optional(),
});

export const cardRouter = router({
  // Card Applications
  apply: protectedProcedure
    .input(CardApplicationInput)
    .mutation(async ({ ctx, input }) => {
      const card = await ctx.prisma.card.findUnique({
        where: { id: input.cardId },
        include: { issuerRules: true },
      });

      if (!card) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Card not found',
        });
      }

      // Check eligibility (5/24, etc.)
      const recentApplications = await ctx.prisma.cardApplication.findMany({
        where: {
          userId: ctx.session.uid,
          appliedAt: {
            gte: new Date(Date.now() - 24 * 30 * 24 * 60 * 60 * 1000), // 24 months
          },
        },
      });

      // Example: Check Chase 5/24
      if (card.issuer === 'Chase' && recentApplications.length >= 5) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Chase 5/24 rule: Too many recent applications',
        });
      }

      return ctx.prisma.cardApplication.create({
        data: {
          userId: ctx.session.uid,
          cardId: input.cardId,
          status: CardStatus.PENDING,
          creditScore: input.creditScore,
          spendDeadline: new Date(Date.now() + card.minSpendPeriod * 30 * 24 * 60 * 60 * 1000),
          notes: input.notes,
        },
      });
    }),

  // Update application status
  updateStatus: protectedProcedure
    .input(z.object({
      applicationId: z.string(),
      status: z.nativeEnum(CardStatus),
      approvedAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const application = await ctx.prisma.cardApplication.findUnique({
        where: { id: input.applicationId },
        include: { card: true },
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
          approvedAt: input.status === CardStatus.APPROVED ? input.approvedAt || new Date() : undefined,
        },
      });
    }),

  // Track spending progress
  updateSpend: protectedProcedure
    .input(SpendUpdateInput)
    .mutation(async ({ ctx, input }) => {
      const application = await ctx.prisma.cardApplication.findUnique({
        where: { id: input.applicationId },
        include: { card: true },
      });

      if (!application || application.userId !== ctx.session.uid) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found',
        });
      }

      const newProgress = application.spendProgress + input.amount;
      const bonusEarned = newProgress >= application.card.minSpend;

      return ctx.prisma.cardApplication.update({
        where: { id: input.applicationId },
        data: {
          spendProgress: newProgress,
          bonusEarnedAt: bonusEarned ? input.date : undefined,
        },
      });
    }),

  // Record retention offer
  addRetentionOffer: protectedProcedure
    .input(RetentionOfferInput)
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

  // Get user's applications
  getApplications: protectedProcedure
    .input(z.object({
      status: z.nativeEnum(CardStatus).optional(),
      limit: z.number().min(1).max(100).default(10),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const applications = await ctx.prisma.cardApplication.findMany({
        where: {
          userId: ctx.session.uid,
          ...(input.status && { status: input.status }),
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        include: {
          card: true,
          creditPull: true,
          retentionOffers: true,
        },
        orderBy: {
          appliedAt: 'desc',
        },
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (applications.length > input.limit) {
        const nextItem = applications.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items: applications,
        nextCursor,
      };
    }),

  // Check application eligibility
  checkEligibility: protectedProcedure
    .input(z.object({
      cardId: z.string(),
    }))
    .query(async ({ ctx, input }): Promise<EligibilityCheck> => {
      const card = await ctx.prisma.card.findUnique({
        where: { id: input.cardId },
        include: { issuerRules: true },
      });

      if (!card) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Card not found',
        });
      }

      const recentApplications = await ctx.prisma.cardApplication.findMany({
        where: {
          userId: ctx.session.uid,
          appliedAt: {
            gte: new Date(Date.now() - 24 * 30 * 24 * 60 * 60 * 1000), // 24 months
          },
        },
        include: { card: true },
      });

      const rules = card.issuerRules.filter(rule => rule.isActive);
      const violations: RuleViolation[] = [];

      // Check each rule
      for (const rule of rules) {
        switch (rule.ruleType) {
          case '5/24':
            if (recentApplications.length >= 5) {
              violations.push({
                rule: '5/24',
                message: 'Too many applications in the past 24 months',
              });
            }
            break;
          // Add more rule checks here
        }
      }

      return {
        eligible: violations.length === 0,
        violations,
      };
    }),
}); 
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { CardStatus, type RuleViolation, type EligibilityCheck } from '@/types/card';
import type { Card, CardApplication } from '@prisma/client';

// Define the rule types
type VelocityRule = '5/24' | '2/30' | '1/90';
type ChurningRule = 'once_lifetime' | 'once_24mo' | 'once_48mo' | 'SAPPHIRE_48';

type ApplicationWithCard = CardApplication & {
  card: Card;
};

interface RuleCheck {
  rule: VelocityRule | ChurningRule;
  check: (applications: ApplicationWithCard[]) => boolean;
  message: string;
}

const ruleChecks: Record<string, RuleCheck> = {
  '5/24': {
    rule: '5/24',
    check: (applications) => applications.length < 5,
    message: 'Too many applications in the past 24 months',
  },
  '2/30': {
    rule: '2/30',
    check: (applications) => applications.length < 2,
    message: 'Too many applications in the past 30 days',
  },
  '1/90': {
    rule: '1/90',
    check: (applications) => applications.length < 1,
    message: 'Too many applications in the past 90 days',
  },
  'once_lifetime': {
    rule: 'once_lifetime',
    check: (applications) => applications.length === 0,
    message: 'Can only receive bonus once per lifetime',
  },
  'once_24mo': {
    rule: 'once_24mo',
    check: (applications) => applications.length === 0,
    message: 'Can only receive bonus once every 24 months',
  },
  'once_48mo': {
    rule: 'once_48mo',
    check: (applications) => applications.length === 0,
    message: 'Can only receive bonus once every 48 months',
  },
  'SAPPHIRE_48': {
    rule: 'SAPPHIRE_48',
    check: (applications) => !applications.some(app => 
      app.card.name.includes('Sapphire') && 
      app.bonusEarnedAt && 
      app.bonusEarnedAt > new Date(Date.now() - 48 * 30 * 24 * 60 * 60 * 1000)
    ),
    message: 'No Sapphire bonus within 48 months',
  },
};

function checkVelocityRule(
  rule: VelocityRule | ChurningRule, 
  applications: ApplicationWithCard[]
): RuleViolation | null {
  const ruleCheck = ruleChecks[rule];
  if (!ruleCheck) {
    return null;
  }

  // Filter applications based on rule timeframe
  const now = new Date();
  const filteredApplications = applications.filter(app => {
    const months = app.appliedAt.getTime() - now.getTime();
    switch (rule) {
      case '5/24':
        return months <= 24 * 30 * 24 * 60 * 60 * 1000;
      case '2/30':
        return months <= 30 * 24 * 60 * 60 * 1000;
      case '1/90':
        return months <= 90 * 24 * 60 * 60 * 1000;
      case 'once_lifetime':
        return true;
      case 'once_24mo':
        return months <= 24 * 30 * 24 * 60 * 60 * 1000;
      case 'once_48mo':
        return months <= 48 * 30 * 24 * 60 * 60 * 1000;
      case 'SAPPHIRE_48':
        return !applications.some(app => 
          app.card.name.includes('Sapphire') && 
          app.bonusEarnedAt && 
          app.bonusEarnedAt > new Date(Date.now() - 48 * 30 * 24 * 60 * 60 * 1000)
        );
      default:
        return false;
    }
  });

  if (!ruleCheck.check(filteredApplications)) {
    return {
      rule,
      message: ruleCheck.message,
    };
  }
  return null;
}

// Input validation schemas
const CardApplicationInput = z.object({
  cardId: z.string(),
  creditScore: z.number().optional(),
  income: z.number().optional(),
  notes: z.string().optional(),
  status: z.nativeEnum(CardStatus).default(CardStatus.PENDING),
  spendProgress: z.number().default(0),
  annualFeePaid: z.boolean().default(false),
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
  // Check card eligibility
  checkEligibility: protectedProcedure
    .input(z.object({
      cardId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
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

      const violations: RuleViolation[] = [];

      // Check velocity rules
      if (card.velocityRules) {
        for (const rule of card.velocityRules as (VelocityRule | ChurningRule)[]) {
          const violation = checkVelocityRule(rule, recentApplications);
          if (violation) {
            violations.push(violation);
          }
        }
      }

      // Check issuer rules
      if (card.issuerRules) {
        const now = new Date();
        for (const rule of card.issuerRules) {
          if (rule.isActive) {
            // Filter applications based on rule timeframe
            const filteredApplications = recentApplications.filter(app => {
              const months = app.appliedAt.getTime() - now.getTime();
              switch (rule.ruleType) {
                case '5/24':
                  return months <= 24 * 30 * 24 * 60 * 60 * 1000;
                case '2/30':
                  return months <= 30 * 24 * 60 * 60 * 1000;
                case '1/90':
                  return months <= 90 * 24 * 60 * 60 * 1000;
                case 'once_lifetime':
                  return true;
                case 'once_24mo':
                  return months <= 24 * 30 * 24 * 60 * 60 * 1000;
                case 'once_48mo':
                case 'SAPPHIRE_48':
                  return months <= 48 * 30 * 24 * 60 * 60 * 1000;
                default:
                  return false;
              }
            });

            const ruleCheck = ruleChecks[rule.ruleType];
            if (ruleCheck && !ruleCheck.check(filteredApplications)) {
              violations.push({
                rule: rule.ruleType,
                message: ruleCheck.message,
              });
            }
          }
        }
      }

      return {
        eligible: violations.length === 0,
        violations,
      } as EligibilityCheck;
    }),

  // Card Applications
  applyForCard: protectedProcedure
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
          status: input.status,
          spendProgress: input.spendProgress,
          annualFeePaid: input.annualFeePaid,
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

      if (application.status !== CardStatus.APPROVED) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot track spend for non-approved applications',
        });
      }

      if (!application.spendDeadline) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Application has no spend deadline set',
        });
      }

      if (input.date > application.spendDeadline) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Spend date is after bonus deadline',
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

      if (application.status !== CardStatus.APPROVED) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot add retention offer for non-approved applications',
        });
      }

      if (application.closedAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot add retention offer for closed applications',
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
}); 
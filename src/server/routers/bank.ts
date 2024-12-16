import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { RequirementType, type BonusProgress } from '@/types/bank';

// Input validation schemas
const BankAccountInput = z.object({
  bankId: z.string(),
  accountType: z.string(),
  bonusId: z.string().optional(),
  minimumBalance: z.number().optional(),
  monthsFeeWaived: z.number().optional(),
  notes: z.string().optional(),
});

const DirectDepositInput = z.object({
  accountId: z.string(),
  amount: z.number(),
  source: z.string(),
  date: z.date().default(() => new Date()),
});

const DebitTransactionInput = z.object({
  accountId: z.string(),
  amount: z.number(),
  description: z.string().optional(),
  date: z.date().default(() => new Date()),
});

export const bankRouter = router({
  // Open new bank account
  openAccount: protectedProcedure
    .input(BankAccountInput)
    .mutation(async ({ ctx, input }) => {
      const bank = await ctx.prisma.bank.findUnique({
        where: { id: input.bankId },
      });

      if (!bank) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Bank not found',
        });
      }

      // Check if user is eligible (no recent accounts/bonuses)
      if (bank.bonusCooldown) {
        const recentBonus = await ctx.prisma.bankAccount.findFirst({
          where: {
            userId: ctx.session.uid,
            bankId: input.bankId,
            bonusEarnedAt: {
              gte: new Date(Date.now() - bank.bonusCooldown * 30 * 24 * 60 * 60 * 1000),
            },
          },
        });

        if (recentBonus) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Must wait ${bank.bonusCooldown} months between bonuses`,
          });
        }
      }

      return ctx.prisma.bankAccount.create({
        data: {
          userId: ctx.session.uid,
          bankId: input.bankId,
          accountType: input.accountType,
          bonusId: input.bonusId,
          minimumBalance: input.minimumBalance,
          monthsFeeWaived: input.monthsFeeWaived,
          notes: input.notes,
        },
      });
    }),

  // Record direct deposit
  addDirectDeposit: protectedProcedure
    .input(DirectDepositInput)
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.prisma.bankAccount.findUnique({
        where: { id: input.accountId },
        include: {
          bonus: {
            include: {
              requirements: true,
            },
          },
        },
      });

      if (!account || account.userId !== ctx.session.uid) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Account not found',
        });
      }

      const dd = await ctx.prisma.directDeposit.create({
        data: {
          accountId: input.accountId,
          amount: input.amount,
          source: input.source,
          date: input.date,
          verified: false, // Will be updated by data points
        },
      });

      // Check if this completes any bonus requirements
      if (account.bonus) {
        const ddRequirements = account.bonus.requirements.filter(
          req => req.type === RequirementType.DIRECT_DEPOSIT
        );

        for (const req of ddRequirements) {
          if (!req.completed && req.amount <= input.amount) {
            const ddCount = await ctx.prisma.directDeposit.count({
              where: {
                accountId: input.accountId,
                amount: { gte: req.amount },
              },
            });

            if (ddCount >= (req.count || 1)) {
              await ctx.prisma.bonusRequirement.update({
                where: { id: req.id },
                data: {
                  completed: true,
                  completedAt: new Date(),
                },
              });
            }
          }
        }
      }

      return dd;
    }),

  // Record debit transaction
  addDebitTransaction: protectedProcedure
    .input(DebitTransactionInput)
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.prisma.bankAccount.findUnique({
        where: { id: input.accountId },
        include: {
          bonus: {
            include: {
              requirements: true,
            },
          },
        },
      });

      if (!account || account.userId !== ctx.session.uid) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Account not found',
        });
      }

      const transaction = await ctx.prisma.debitTransaction.create({
        data: {
          accountId: input.accountId,
          amount: input.amount,
          description: input.description,
          date: input.date,
        },
      });

      // Check if this completes any bonus requirements
      if (account.bonus) {
        const debitRequirements = account.bonus.requirements.filter(
          req => req.type === RequirementType.DEBIT_TRANSACTIONS
        );

        for (const req of debitRequirements) {
          if (!req.completed) {
            const transactionCount = await ctx.prisma.debitTransaction.count({
              where: {
                accountId: input.accountId,
              },
            });

            if (transactionCount >= req.count) {
              await ctx.prisma.bonusRequirement.update({
                where: { id: req.id },
                data: {
                  completed: true,
                  completedAt: new Date(),
                },
              });
            }
          }
        }
      }

      return transaction;
    }),

  // Get user's bank accounts
  getAccounts: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const accounts = await ctx.prisma.bankAccount.findMany({
        where: {
          userId: ctx.session.uid,
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        include: {
          bank: true,
          bonus: {
            include: {
              requirements: true,
            },
          },
          directDeposits: true,
          debitTransactions: true,
        },
        orderBy: {
          openedAt: 'desc',
        },
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (accounts.length > input.limit) {
        const nextItem = accounts.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items: accounts,
        nextCursor,
      };
    }),

  // Get bonus progress
  getBonusProgress: protectedProcedure
    .input(z.object({
      accountId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const account = await ctx.prisma.bankAccount.findUnique({
        where: { id: input.accountId },
        include: {
          bank: true,
          bonus: {
            include: {
              requirements: true,
            },
          },
          directDeposits: true,
          debitTransactions: true,
        },
      });

      if (!account || account.userId !== ctx.session.uid) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Account not found',
        });
      }

      if (!account.bonus) {
        return null;
      }

      const progress: BonusProgress[] = account.bonus.requirements.map(req => {
        switch (req.type) {
          case RequirementType.DIRECT_DEPOSIT:
            const ddCount = account.directDeposits.filter(
              dd => dd.amount >= req.amount
            ).length;
            return {
              type: req.type,
              required: req.count || 1,
              completed: ddCount,
              amount: req.amount,
              deadline: req.deadline,
              isComplete: req.completed,
            };

          case RequirementType.DEBIT_TRANSACTIONS:
            return {
              type: req.type,
              required: req.count || 1,
              completed: account.debitTransactions.length,
              deadline: req.deadline,
              isComplete: req.completed,
            };

          default:
            return {
              type: req.type,
              required: req.count || 1,
              completed: 0,
              deadline: req.deadline,
              isComplete: req.completed,
            };
        }
      });

      return {
        bonus: account.bonus,
        progress,
        isComplete: progress.every(p => p.isComplete),
      };
    }),

  // Add data point
  addDataPoint: protectedProcedure
    .input(z.object({
      bankId: z.string(),
      type: z.string(),
      description: z.string(),
      successRate: z.number().min(0).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.dataPoint.create({
        data: {
          bankId: input.bankId,
          type: input.type,
          description: input.description,
          successRate: input.successRate,
        },
      });
    }),
}); 
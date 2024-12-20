import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type {
  Bank,
  BankAccount,
  BonusRequirement,
  DebitTransaction,
  DirectDeposit,
  PrismaClient,
} from '@prisma/client';
import { TRPCError } from '@trpc/server';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { mockDeep } from 'jest-mock-extended';

import { appRouter } from '@/server/routers/_app';
import { RequirementType } from '@/types/bank';

// Mock Prisma client with proper typing
const mockPrisma = mockDeep<PrismaClient>();

// Mock session with full DecodedIdToken
const mockSession: DecodedIdToken = {
  uid: 'test-user-id',
  aud: 'test-audience',
  auth_time: Date.now(),
  exp: Date.now() + 3600,
  iat: Date.now(),
  iss: 'https://securetoken.google.com/test-project',
  sub: 'test-user',
  email: 'test@example.com',
  email_verified: true,
  firebase: {
    identities: {
      email: ['test@example.com'],
    },
    sign_in_provider: 'custom',
  },
};

describe('Bank Router', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    jest.clearAllMocks();
    const ctx = {
      session: mockSession,
      prisma: mockPrisma,
    };
    caller = appRouter.createCaller(ctx);
  });

  describe('openAccount', () => {
    const mockInput = {
      bankId: 'test-bank-id',
      accountType: 'checking',
      bonusId: 'test-bonus-id',
      minimumBalance: 1500,
      monthsFeeWaived: 3,
      notes: 'Test notes',
    } as const;

    it('should create a new bank account', async () => {
      mockPrisma.bank.findUnique.mockResolvedValueOnce({
        id: 'test-bank-id',
        bonusCooldown: 0,
        name: 'Test Bank',
        website: null,
        chexSystemsSensitive: false,
        earlyTermFee: null,
        earlyTermPeriod: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Bank);

      mockPrisma.bankAccount.create.mockResolvedValueOnce({
        id: 'test-account-id',
        userId: mockSession.uid,
        bankId: mockInput.bankId,
        accountType: mockInput.accountType,
        bonusId: mockInput.bonusId,
        openedAt: new Date(),
        closedAt: null,
        bonusEarnedAt: null,
        minimumBalance: mockInput.minimumBalance,
        monthsFeeWaived: mockInput.monthsFeeWaived,
        notes: mockInput.notes,
      } as BankAccount);

      const result = await caller.bank.openAccount(mockInput);

      expect(result).toEqual(
        expect.objectContaining({
          id: 'test-account-id',
          userId: mockSession.uid,
          bankId: mockInput.bankId,
        })
      );
      expect(mockPrisma.bank.findUnique).toHaveBeenCalledWith({
        where: { id: mockInput.bankId },
      });
      expect(mockPrisma.bankAccount.create).toHaveBeenCalledWith({
        data: {
          userId: mockSession.uid,
          ...mockInput,
        },
      });
    });

    it('should throw error if bank not found', async () => {
      mockPrisma.bank.findUnique.mockResolvedValueOnce(null);

      await expect(caller.bank.openAccount(mockInput)).rejects.toThrow(
        new TRPCError({
          code: 'NOT_FOUND',
          message: 'Bank not found',
        })
      );
    });

    it('should enforce bonus cooldown period', async () => {
      mockPrisma.bank.findUnique.mockResolvedValueOnce({
        id: 'test-bank-id',
        bonusCooldown: 12,
        name: 'Test Bank',
        website: null,
        chexSystemsSensitive: false,
        earlyTermFee: null,
        earlyTermPeriod: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Bank);

      mockPrisma.bankAccount.findFirst.mockResolvedValueOnce({
        id: 'test-account-id',
        bonusEarnedAt: new Date(),
      } as BankAccount);

      await expect(caller.bank.openAccount(mockInput)).rejects.toThrow(
        new TRPCError({
          code: 'FORBIDDEN',
          message: 'Must wait 12 months between bonuses',
        })
      );
    });
  });

  describe('addDirectDeposit', () => {
    const mockInput = {
      accountId: 'test-account-id',
      amount: 1000,
      source: 'Employer',
      date: new Date(),
    } as const;

    const mockAccount = {
      id: 'test-account-id',
      userId: mockSession.uid,
      bankId: 'test-bank-id',
      accountType: 'checking',
      openedAt: new Date(),
      bonus: {
        requirements: [
          {
            id: 'req-1',
            type: RequirementType.DIRECT_DEPOSIT,
            amount: 500,
            count: 2,
            completed: false,
          } as BonusRequirement,
        ],
      },
    } as BankAccount & { bonus: { requirements: BonusRequirement[] } };

    it('should create a direct deposit', async () => {
      mockPrisma.bankAccount.findUnique.mockResolvedValueOnce(mockAccount);
      mockPrisma.directDeposit.create.mockResolvedValueOnce({
        id: 'test-deposit-id',
        accountId: mockInput.accountId,
        amount: mockInput.amount,
        source: mockInput.source,
        date: mockInput.date,
        verified: false,
      } as DirectDeposit);
      mockPrisma.directDeposit.count.mockResolvedValueOnce(2);

      const result = await caller.bank.addDirectDeposit(mockInput);

      expect(result).toEqual(
        expect.objectContaining({
          id: 'test-deposit-id',
          accountId: mockInput.accountId,
        })
      );
      expect(mockPrisma.directDeposit.create).toHaveBeenCalledWith({
        data: {
          ...mockInput,
          verified: false,
        },
      });
      expect(mockPrisma.bonusRequirement.update).toHaveBeenCalled();
    });

    it('should throw error if account not found', async () => {
      mockPrisma.bankAccount.findUnique.mockResolvedValueOnce(null);

      await expect(caller.bank.addDirectDeposit(mockInput)).rejects.toThrow(
        new TRPCError({
          code: 'NOT_FOUND',
          message: 'Account not found',
        })
      );
    });
  });

  describe('getAccounts', () => {
    const mockInput = {
      limit: 10,
      cursor: undefined,
    } as const;

    it('should return paginated bank accounts', async () => {
      const mockAccounts = [
        {
          id: 'account-1',
          userId: mockSession.uid,
          bankId: 'test-bank-id',
          accountType: 'checking',
          openedAt: new Date(),
          closedAt: null,
          bonusId: null,
          bonusEarnedAt: null,
          minimumBalance: null,
          monthsFeeWaived: null,
          notes: null,
          bank: {
            id: 'test-bank-id',
            name: 'Test Bank',
            website: null,
            chexSystemsSensitive: false,
            earlyTermFee: null,
            earlyTermPeriod: null,
            bonusCooldown: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          bonus: null,
          directDeposits: [],
          debitTransactions: [],
        },
        {
          id: 'account-2',
          userId: mockSession.uid,
          bankId: 'test-bank-id',
          accountType: 'savings',
          openedAt: new Date(),
          closedAt: null,
          bonusId: null,
          bonusEarnedAt: null,
          minimumBalance: null,
          monthsFeeWaived: null,
          notes: null,
          bank: {
            id: 'test-bank-id',
            name: 'Test Bank',
            website: null,
            chexSystemsSensitive: false,
            earlyTermFee: null,
            earlyTermPeriod: null,
            bonusCooldown: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          bonus: null,
          directDeposits: [],
          debitTransactions: [],
        },
      ] as (BankAccount & {
        bank: Bank;
        bonus: null;
        directDeposits: DirectDeposit[];
        debitTransactions: DebitTransaction[];
      })[];

      mockPrisma.bankAccount.findMany.mockResolvedValueOnce(mockAccounts);
      mockPrisma.bankAccount.count.mockResolvedValueOnce(2);

      const result = await caller.bank.getAccounts(mockInput);

      expect(result.items).toEqual(mockAccounts);
      expect(result.nextCursor).toBeUndefined();
    });
  });
});

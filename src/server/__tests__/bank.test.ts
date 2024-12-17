import { describe, expect, test } from '@jest/globals';
import type { PrismaClient, BankAccount, BonusRequirement, DirectDeposit } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import type { NextRequest } from 'next/server';

import { createContext } from '@/server/context';
import type { CreateContextOptions } from '@/server/context';
import { appRouter } from '@/server/routers/_app';
import { RequirementType } from '@/types/bank';

// Create mock instances
const prismaMock = mockDeep<PrismaClient>();

// Mock data
const mockBank = {
  id: 'test-bank',
  name: 'Test Bank',
  bonusCooldown: 12,
  createdAt: new Date(),
  updatedAt: new Date(),
  website: null,
  chexSystemsSensitive: false,
  earlyTermFee: null,
  earlyTermPeriod: null,
};

const mockBankAccount = {
  id: 'test-account',
  userId: 'test-user',
  bankId: 'test-bank',
  accountType: 'CHECKING',
  openedAt: new Date(),
  closedAt: null,
  bonusId: 'test-bonus',
  bonusEarnedAt: null,
  minimumBalance: 1500,
  monthsFeeWaived: 12,
  notes: 'Test account',
};

const mockBonus = {
  id: 'test-bonus',
  bankId: 'test-bank',
  amount: 500,
  requirements: [
    {
      id: 'req-1',
      bonusId: 'test-bonus',
      type: RequirementType.DIRECT_DEPOSIT,
      amount: 5000,
      count: 2,
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      completed: false,
      completedAt: null,
    },
  ],
};

const mockDirectDeposit = {
  id: 'test-dd',
  accountId: 'test-account',
  amount: 5000,
  source: 'Employer',
  date: new Date(),
  verified: false,
};

// Mock request
const mockRequest = (headers: Record<string, string> = {}): NextRequest => {
  const headerMap = new Map(Object.entries(headers));
  return {
    headers: {
      get: (key: string) => headerMap.get(key) ?? null,
      ...headers,
    },
  } as NextRequest;
};

// Update test context with authenticated user and Prisma mock
const createAuthContext = async (): Promise<CreateContextOptions> => {
  const context = await createContext(
    mockRequest({
      authorization: 'Bearer test-token',
    })
  );

  context.session = {
    uid: 'test-user',
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

  context.prisma = prismaMock;
  return context;
};

// Create a properly typed caller
const createCaller = async (): Promise<ReturnType<typeof appRouter.createCaller>> => {
  const context = await createAuthContext();
  return appRouter.createCaller(context);
};

describe('Bank Router', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('openAccount', () => {
    test('should open a new bank account successfully', async () => {
      const caller = await createCaller();

      prismaMock.bank.findUnique.mockResolvedValueOnce(mockBank);
      prismaMock.bankAccount.findFirst.mockResolvedValueOnce(null);
      prismaMock.bankAccount.create.mockResolvedValueOnce(mockBankAccount);

      const result = await caller.bank.openAccount({
        bankId: 'test-bank',
        accountType: 'CHECKING',
        bonusId: 'test-bonus',
        minimumBalance: 1500,
        monthsFeeWaived: 12,
        notes: 'Test account',
      });

      expect(result).toEqual(mockBankAccount);
    });

    test('should throw error if bank not found', async () => {
      const caller = await createCaller();

      prismaMock.bank.findUnique.mockResolvedValueOnce(null);

      await expect(
        caller.bank.openAccount({
          bankId: 'non-existent',
          accountType: 'CHECKING',
        })
      ).rejects.toThrow('Bank not found');
    });

    test('should throw error if within bonus cooldown period', async () => {
      const caller = await createCaller();

      prismaMock.bank.findUnique.mockResolvedValueOnce(mockBank);
      prismaMock.bankAccount.findFirst.mockResolvedValueOnce(mockBankAccount);

      await expect(
        caller.bank.openAccount({
          bankId: 'test-bank',
          accountType: 'CHECKING',
        })
      ).rejects.toThrow('Must wait 12 months between bonuses');
    });
  });

  describe('addDirectDeposit', () => {
    test('should add direct deposit successfully', async () => {
      const caller = await createCaller();

      prismaMock.bankAccount.findUnique.mockResolvedValueOnce({
        ...mockBankAccount,
        bonus: {
          ...mockBonus,
          requirements: [mockBonus.requirements[0]],
        },
        directDeposits: [mockDirectDeposit],
      } as BankAccount & {
        bonus: {
          requirements: BonusRequirement[];
        };
        directDeposits: DirectDeposit[];
      });
      prismaMock.directDeposit.create.mockResolvedValueOnce(mockDirectDeposit);
      prismaMock.directDeposit.count.mockResolvedValueOnce(2);
      prismaMock.bonusRequirement.update.mockResolvedValueOnce({
        ...mockBonus.requirements[0],
        completed: true,
        completedAt: new Date(),
      });

      const result = await caller.bank.addDirectDeposit({
        accountId: 'test-account',
        amount: 5000,
        source: 'Employer',
        date: new Date(),
      });

      expect(result).toEqual(mockDirectDeposit);
      expect(prismaMock.bonusRequirement.update).toHaveBeenCalled();
    });

    test('should throw error if account not found', async () => {
      const caller = await createCaller();

      prismaMock.bankAccount.findUnique.mockResolvedValueOnce(null);

      await expect(
        caller.bank.addDirectDeposit({
          accountId: 'non-existent',
          amount: 5000,
          source: 'Employer',
          date: new Date(),
        })
      ).rejects.toThrow('Account not found');
    });
  });

  describe('getAccounts', () => {
    test('should return paginated accounts', async () => {
      const caller = await createCaller();

      const mockAccounts = [mockBankAccount, { ...mockBankAccount, id: 'test-account-2' }];
      prismaMock.bankAccount.findMany.mockResolvedValueOnce(mockAccounts);

      const result = await caller.bank.getAccounts({
        limit: 1,
      });

      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBe('test-account-2');
    });
  });

  describe('getBonusProgress', () => {
    test('should return bonus progress', async () => {
      const caller = await createCaller();

      prismaMock.bankAccount.findUnique.mockResolvedValueOnce({
        ...mockBankAccount,
        bonus: mockBonus,
        directDeposits: [mockDirectDeposit],
      } as BankAccount & {
        bonus: {
          requirements: BonusRequirement[];
        };
        directDeposits: DirectDeposit[];
      });

      const result = await caller.bank.getBonusProgress({
        accountId: 'test-account',
      });

      expect(result).toEqual({
        bonus: mockBonus,
        progress: expect.any(Array),
        isComplete: false,
      });
    });

    test('should return null if no bonus attached', async () => {
      const caller = await createCaller();

      prismaMock.bankAccount.findUnique.mockResolvedValueOnce({
        ...mockBankAccount,
        bonusId: null,
      } as BankAccount);

      const result = await caller.bank.getBonusProgress({
        accountId: 'test-account',
      });

      expect(result).toBeNull();
    });
  });
});

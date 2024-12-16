import { createContext } from '../trpc';
import { appRouter } from '../routers/_app';
import { inferProcedureInput } from '@trpc/server';
import { mockDeep, mockReset } from 'jest-mock-extended';
import { prisma } from '@/lib/prisma/db';
import type { AppRouter } from '../routers/_app';

// Mock Prisma
jest.mock('@/lib/prisma/db', () => ({
  prisma: mockDeep(),
}));

const prismaMock = prisma as jest.Mocked<typeof prisma>;

// Reset mocks before each test
beforeEach(() => {
  mockReset(prismaMock);
});

// Test context with authenticated user
const createAuthContext = () => {
  return createContext({
    req: {
      headers: {
        authorization: 'Bearer test-token',
      },
    } as any,
  });
};

// Test context without authentication
const createAnonContext = () => {
  return createContext({
    req: {
      headers: {},
    } as any,
  });
};

describe('Card Router', () => {
  test('checkEligibility - should check Chase 5/24 rule', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock recent applications
    prismaMock.card.findUnique.mockResolvedValueOnce({
      id: 'test-card',
      issuer: 'Chase',
      name: 'Sapphire Preferred',
      type: 'Credit',
      network: 'Visa',
      rewardType: 'Points',
      signupBonus: 60000,
      minSpend: 4000,
      minSpendPeriod: 3,
      annualFee: 95,
      isActive: true,
      businessCard: false,
      velocityRules: ['5/24'],
      churningRules: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    prismaMock.cardApplication.findMany.mockResolvedValueOnce([
      // Mock 5 recent applications
      ...Array(5).fill({
        id: 'test-app',
        userId: 'test-user',
        cardId: 'test-card',
        status: 'approved',
        appliedAt: new Date(),
        spendProgress: 0,
        annualFeePaid: false,
      }),
    ]);

    type Input = inferProcedureInput<AppRouter['card']['checkEligibility']>;
    const input: Input = {
      cardId: 'test-card',
    };

    const result = await caller.card.checkEligibility(input);
    expect(result.eligible).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].rule).toBe('5/24');
  });
});

describe('Bank Router', () => {
  test('addDirectDeposit - should track DD progress', async () => {
    const caller = appRouter.createCaller(await createAuthContext());

    // Mock bank account with bonus requirements
    prismaMock.bankAccount.findUnique.mockResolvedValueOnce({
      id: 'test-account',
      userId: 'test-user',
      bankId: 'test-bank',
      accountType: 'checking',
      bonusId: 'test-bonus',
      openedAt: new Date(),
      minimumBalance: null,
      monthsFeeWaived: null,
      notes: null,
    });

    // Mock direct deposit creation
    prismaMock.directDeposit.create.mockResolvedValueOnce({
      id: 'test-dd',
      accountId: 'test-account',
      amount: 500,
      source: 'Employer',
      date: new Date(),
      verified: false,
    });

    type Input = inferProcedureInput<AppRouter['bank']['addDirectDeposit']>;
    const input: Input = {
      accountId: 'test-account',
      amount: 500,
      source: 'Employer',
      date: new Date(),
    };

    const result = await caller.bank.addDirectDeposit(input);
    expect(result.amount).toBe(500);
    expect(result.source).toBe('Employer');
    expect(result.verified).toBe(false);
  });
});

describe('Authentication', () => {
  test('protected routes - should require authentication', async () => {
    const caller = appRouter.createCaller(await createAnonContext());

    // Try to access protected route
    await expect(
      caller.card.getApplications({
        limit: 10,
      })
    ).rejects.toThrow('UNAUTHORIZED');
  });
}); 
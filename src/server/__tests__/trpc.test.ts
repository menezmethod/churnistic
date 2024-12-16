import { createContext } from '../trpc';
import { appRouter } from '../routers/_app';
import { inferProcedureInput } from '@trpc/server';
import { mockDeep, mockReset } from 'jest-mock-extended';
import type { AppRouter } from '../routers/_app';
import { prisma, type MockPrismaClient } from '@/lib/prisma/__mocks__/db';
import { getAuth } from 'firebase-admin/auth';
import type { DecodedIdToken } from 'firebase-admin/auth';
import type { Card, IssuerRule, BankAccount, BonusRequirement } from '@prisma/client';

// Mock Prisma
jest.mock('@/lib/prisma/db');

// Mock Firebase Admin Auth
jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    verifyIdToken: jest.fn(() => Promise.resolve({
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
    } as DecodedIdToken)),
  })),
}));

// Get the mocked prisma instance
const prismaMock = prisma as MockPrismaClient;

// Reset mocks before each test
beforeEach(() => {
  mockReset(prismaMock);
  (getAuth().verifyIdToken as jest.Mock).mockClear();
});

// Mock Next.js request/response
const mockRequest = (headers = {}) => ({
  headers: new Headers(headers),
  cookies: new Map(),
  nextUrl: new URL('http://localhost:3000'),
});

const mockResponse = () => ({
  headers: new Headers(),
});

// Test context with authenticated user
const createAuthContext = async () => {
  const context = await createContext({
    req: mockRequest({
      authorization: 'Bearer test-token',
    }),
    res: mockResponse(),
  } as any);

  // Mock the session with full DecodedIdToken
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

  return context;
};

// Test context without authentication
const createAnonContext = () => {
  return createContext({
    req: mockRequest(),
    res: mockResponse(),
  } as any);
};

describe('Card Router', () => {
  test('checkEligibility - should check Chase 5/24 rule', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    
    // Mock card with issuer rules
    const mockCard: Card & { issuerRules: IssuerRule[] } = {
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
      creditScoreMin: null,
      referralBonus: null,
      referralBonusCash: null,
      issuerRules: [{
        id: 'rule-1',
        cardId: 'test-card',
        ruleType: '5/24',
        description: 'No more than 5 cards in 24 months',
        cooldownPeriod: 24,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        maxCards: null,
      }],
    };

    prismaMock.card.findUnique.mockResolvedValueOnce(mockCard);

    // Mock recent applications
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
    const mockBankAccount = {
      id: 'test-account',
      userId: 'test-user',
      bankId: 'test-bank',
      accountType: 'checking',
      bonusId: 'test-bonus',
      openedAt: new Date(),
      closedAt: null,
      bonusEarnedAt: null,
      minimumBalance: null,
      monthsFeeWaived: null,
      notes: null,
      bonus: {
        include: {
          requirements: [{
            id: 'req-1',
            bonusId: 'test-bonus',
            type: 'DIRECT_DEPOSIT',
            amount: 500,
            count: 2,
            deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            completed: false,
            completedAt: null,
          }],
        },
      },
      directDeposits: [],
      debitTransactions: [],
    };

    prismaMock.bankAccount.findUnique.mockResolvedValueOnce(mockBankAccount);

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
import { describe, expect, test } from '@jest/globals';
import type { Card, CardApplication, PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import type { NextRequest } from 'next/server';

import { createContext } from '@/server/context';
import type { CreateContextOptions } from '@/server/context';
import { appRouter } from '@/server/routers/_app';
import { CardStatus } from '@/types/card';

// Create mock instances
export const prismaMock = mockDeep<PrismaClient>();

// Setup mock data
const mockCard: Card = {
  id: 'test-card-id',
  issuerId: 'test-issuer-id',
  name: 'Test Card',
  type: 'credit',
  network: 'visa',
  rewardType: 'cashback',
  signupBonus: 500,
  minSpend: 3000,
  minSpendPeriod: 90,
  annualFee: 95,
  isActive: true,
  creditScoreMin: 700,
  businessCard: false,
  velocityRules: [],
  churningRules: [],
  referralBonus: null,
  referralBonusCash: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockApplication: CardApplication = {
  id: 'test-application',
  userId: 'test-user',
  cardId: 'test-card',
  status: CardStatus.PENDING,
  notes: 'Test application',
  appliedAt: new Date(),
  approvedAt: null,
  bonusEarnedAt: null,
  closedAt: null,
  creditPullId: null,
  annualFeePaid: false,
  annualFeeDue: null,
  spendProgress: 0,
  spendDeadline: null,
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

  // Use mock Prisma client
  context.prisma = prismaMock;

  return context;
};

// Create a properly typed caller
const createCaller = async (): Promise<ReturnType<typeof appRouter.createCaller>> => {
  return appRouter.createCaller(await createAuthContext());
};

describe('Card Router', () => {
  test('getApplications - should return all applications for user', async () => {
    const caller = await createCaller();

    const mockApplicationWithCard = {
      ...mockApplication,
      card: mockCard,
      creditPull: null,
      retentionOffers: [],
    };

    prismaMock.cardApplication.findMany.mockResolvedValueOnce([mockApplicationWithCard]);

    const result = await caller.card.getApplications({
      limit: 10,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe(mockApplication.id);
  });
});

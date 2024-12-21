import { PrismaClient } from '@prisma/client';
import { DecodedIdToken } from 'firebase-admin/auth';
import { mockDeep } from 'jest-mock-extended';

import { CardStatus } from '@/types/card';

import { Context } from '../context';
import { appRouter } from '../routers/_app';

// Mock TRPC client
jest.mock('@trpc/client', () => ({
  createTRPCProxyClient: jest.fn(() => ({
    card: {
      apply: {
        mutate: jest.fn(),
      },
      getApplications: {
        query: jest.fn(),
      },
      updateStatus: {
        mutate: jest.fn(),
      },
    },
  })),
  httpBatchLink: jest.fn(),
}));

describe('Card Router', () => {
  let ctx: Context;
  let caller: ReturnType<typeof appRouter.createCaller>;

  const mockSession: DecodedIdToken = {
    uid: 'test-uid',
    email: 'test@example.com',
    iat: 0,
    exp: 0,
    aud: '',
    iss: '',
    sub: '',
    auth_time: 0,
    firebase: {
      identities: {},
      sign_in_provider: 'custom',
    },
  };

  beforeEach(() => {
    ctx = {
      prisma: mockDeep<PrismaClient>(),
      session: { uid: mockSession.uid },
      user: mockSession,
    };
    caller = appRouter.createCaller(ctx);
  });

  describe('getApplications', () => {
    it('returns all card applications', async () => {
      const mockApplications = [
        {
          id: '1',
          userId: mockSession.uid,
          cardId: 'card-1',
          status: CardStatus.PENDING,
          notes: 'Test application',
          appliedAt: new Date(),
          approvedAt: null,
          bonusEarnedAt: null,
          closedAt: null,
          spendProgress: 0,
          annualFeePaid: false,
          creditPullId: null,
          annualFeeDue: null,
          spendDeadline: null,
          card: {
            id: 'card-1',
            name: 'Test Card',
            issuerId: 'issuer-1',
            type: 'credit',
            network: 'visa',
            rewardType: 'points',
            signupBonus: 50000,
            minSpend: 3000,
            minSpendPeriod: 90,
            annualFee: 95,
            isActive: true,
            creditScoreMin: 700,
            businessCard: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            velocityRules: [],
            churningRules: [],
            referralBonus: null,
            referralBonusCash: null,
          },
          retentionOffers: [],
        },
      ];

      (ctx.prisma.cardApplication.findMany as jest.Mock).mockResolvedValue(
        mockApplications
      );
      (ctx.prisma.cardApplication.count as jest.Mock).mockResolvedValue(1);

      const result = await caller.card.getApplications({ limit: 10 });
      expect(result.items).toEqual(mockApplications);
      expect(result.total).toEqual(1);
    });
  });

  describe('updateStatus', () => {
    it('updates application status', async () => {
      const mockApplication = {
        id: '1',
        userId: mockSession.uid,
        cardId: 'card-1',
        status: CardStatus.PENDING,
        notes: 'Test application',
        appliedAt: new Date(),
        approvedAt: null,
        bonusEarnedAt: null,
        closedAt: null,
        spendProgress: 0,
        annualFeePaid: false,
        creditPullId: null,
        annualFeeDue: null,
        spendDeadline: null,
      };

      const updatedApplication = {
        ...mockApplication,
        status: CardStatus.APPROVED,
        approvedAt: new Date(),
        notes: 'Approved',
      };

      (ctx.prisma.cardApplication.findUnique as jest.Mock).mockResolvedValue(
        mockApplication
      );
      (ctx.prisma.cardApplication.update as jest.Mock).mockResolvedValue(
        updatedApplication
      );

      const result = await caller.card.updateStatus({
        applicationId: mockApplication.id,
        status: CardStatus.APPROVED,
        notes: 'Approved',
      });

      expect(result).toEqual(updatedApplication);
      expect(ctx.prisma.cardApplication.findUnique).toHaveBeenCalledWith({
        where: { id: mockApplication.id },
      });
      expect(ctx.prisma.cardApplication.update).toHaveBeenCalledWith({
        where: { id: mockApplication.id },
        data: {
          status: CardStatus.APPROVED,
          approvedAt: expect.any(Date),
          closedAt: undefined,
          notes: 'Approved',
        },
      });
    });

    it('throws error when application not found', async () => {
      (ctx.prisma.cardApplication.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        caller.card.updateStatus({
          applicationId: 'non-existent',
          status: CardStatus.APPROVED,
          notes: 'Approved',
        })
      ).rejects.toThrow('Application not found');
    });
  });
});

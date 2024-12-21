import { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { DecodedIdToken } from 'firebase-admin/auth';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { CardStatus } from '@/types/card';

import { Context } from '../context';
import { appRouter } from '../routers/_app';

describe('Card Router', () => {
  let ctx: {
    prisma: DeepMockProxy<PrismaClient>;
    session: DecodedIdToken;
    user: DecodedIdToken;
  };
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
      session: mockSession,
      user: mockSession,
    };
    caller = appRouter.createCaller(ctx as Context);
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

      ctx.prisma.cardApplication.findMany.mockResolvedValue(mockApplications);

      const result = await caller.card.getApplications({ limit: 10 });
      expect(result.items).toEqual(mockApplications);
    });
  });

  describe('apply', () => {
    it('applies for a card', async () => {
      const mockCard = {
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
      };

      const mockApplication = {
        id: '1',
        userId: mockSession.uid,
        cardId: mockCard.id,
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

      ctx.prisma.card.findUnique.mockResolvedValue(mockCard);
      ctx.prisma.cardApplication.create.mockResolvedValue(mockApplication);

      const result = await caller.card.apply({
        cardId: mockCard.id,
        creditScore: 750,
        notes: 'Test application',
      });

      expect(result).toEqual(mockApplication);
    });

    it('throws error when card not found', async () => {
      ctx.prisma.card.findUnique.mockResolvedValue(null);

      await expect(
        caller.card.apply({
          cardId: 'non-existent',
          creditScore: 750,
          notes: 'Test application',
        })
      ).rejects.toThrow(
        new TRPCError({
          code: 'NOT_FOUND',
          message: 'Card not found',
        })
      );
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

      ctx.prisma.cardApplication.findUnique.mockResolvedValue(mockApplication);
      ctx.prisma.cardApplication.update.mockResolvedValue(updatedApplication);

      const result = await caller.card.updateStatus({
        applicationId: mockApplication.id,
        status: CardStatus.APPROVED,
        notes: 'Approved',
      });

      expect(result).toEqual(updatedApplication);
    });

    it('throws error when application not found', async () => {
      ctx.prisma.cardApplication.findUnique.mockResolvedValue(null);

      await expect(
        caller.card.updateStatus({
          applicationId: 'non-existent',
          status: CardStatus.APPROVED,
          notes: 'Approved',
        })
      ).rejects.toThrow(
        new TRPCError({
          code: 'NOT_FOUND',
          message: 'Application not found',
        })
      );
    });
  });
});

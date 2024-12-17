import { describe, expect, test } from '@jest/globals';
import type { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import type { NextRequest } from 'next/server';

import { createContext } from '@/server/context';
import type { CreateContextOptions } from '@/server/context';
import { appRouter } from '@/server/routers/_app';
import type { Card } from '@/types/card';
import { CardStatus } from '@/types/card';
import type { User } from '@/types/user';

// Create mock instances
const prismaMock = mockDeep<PrismaClient>();

// Mock data
const mockCard: Card = {
  id: 'test-card-id',
  issuer: 'Test Issuer',
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

const mockApplication = {
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

const mockRetentionOffer = {
  id: 'test-offer',
  applicationId: 'test-application',
  cardId: 'test-card',
  pointsOffered: 10000,
  statementCredit: null,
  spendRequired: null,
  notes: 'Test offer',
  offerDate: new Date(),
  accepted: null,
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

// Add type for mock user with business verification
type MockUser = User & {
  businessVerified: boolean;
};

// Add type for mock application with card
type MockApplicationWithCard = typeof mockApplication & {
  card: Card;
};

// Mock data
const mockUser = {
  id: 'test-user',
  firebaseUid: 'test-firebase-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  creditScore: null,
  monthlyIncome: null,
  householdId: null,
  businessVerified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
} as const;

describe('Card Router', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('apply', () => {
    test('should apply for card successfully', async () => {
      const caller = await createCaller();

      const mockCardWithRules = {
          ...mockCard,
          issuerRules: [],
      } as unknown as Card & {
        issuerRules: { id: string; issuerId: string; maxCards: number; cooldownPeriod: number; isActive: boolean; }[];
      };

      prismaMock.card.findUnique.mockResolvedValueOnce(mockCardWithRules);
      prismaMock.cardApplication.create.mockResolvedValueOnce(mockApplication);

      const result = await caller.card.applyForCard({
        cardId: 'test-card',
        creditScore: 750,
        notes: 'Test application',
      });

      expect(result).toEqual(mockApplication);
      expect(prismaMock.card.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-card' },
        include: {
          issuerRules: true,
        },
      });
    });

    test('should throw error if card not found', async () => {
      const caller = await createCaller();

      prismaMock.card.findUnique.mockResolvedValueOnce(null);

      await expect(
        caller.card.applyForCard({
          cardId: 'non-existent',
        })
      ).rejects.toThrow('Card not found');
    });

    test('should validate velocity rules', async () => {
      const caller = await createCaller();

      const mockCardWithRules = {
          ...mockCard,
          velocityRules: [
              {
                  id: 'rule-1',
                  cardId: 'test-card',
                  maxApplications: 2,
                  periodDays: 30,
                  isActive: true,
              },
          ],
          issuerRules: [],
      } as unknown as Card & {
        velocityRules: { id: string; cardId: string; maxApplications: number; periodDays: number; isActive: boolean; }[];
        issuerRules: { id: string; issuerId: string; maxCards: number; cooldownPeriod: number; isActive: boolean; }[];
      };

      prismaMock.card.findUnique.mockResolvedValueOnce(mockCardWithRules);
      prismaMock.cardApplication.count.mockResolvedValueOnce(2);

      await expect(
        caller.card.applyForCard({
          cardId: 'test-card',
          notes: 'Test application',
        })
      ).rejects.toThrow('Maximum applications reached for this period');
    });

    test('should validate churning rules', async () => {
      const caller = await createCaller();

      const mockCardWithRules = {
          ...mockCard,
          churningRules: [
              {
                  id: 'rule-1',
                  cardId: 'test-card',
                  bonusCooldown: 48,
                  isActive: true,
              },
          ],
          issuerRules: [],
      } as unknown as Card & {
        churningRules: { id: string; cardId: string; bonusCooldown: number; isActive: boolean; }[];
        issuerRules: { id: string; issuerId: string; maxCards: number; cooldownPeriod: number; isActive: boolean; }[];
      };

      prismaMock.card.findUnique.mockResolvedValueOnce(mockCardWithRules);
      prismaMock.cardApplication.findFirst.mockResolvedValueOnce({
        ...mockApplication,
        bonusEarnedAt: new Date(),
      });

      await expect(
        caller.card.applyForCard({
          cardId: 'test-card',
          notes: 'Test application',
        })
      ).rejects.toThrow('Must wait 48 months between signup bonuses');
    });

    test('should ignore inactive rules', async () => {
      const caller = await createCaller();

      const mockCardWithRules = {
          ...mockCard,
          velocityRules: [
              {
                  id: 'rule-1',
                  cardId: 'test-card',
                  maxApplications: 2,
                  periodDays: 30,
                  isActive: false,
              },
          ],
          churningRules: [
              {
                  id: 'rule-1',
                  cardId: 'test-card',
                  bonusCooldown: 48,
                  isActive: false,
              },
          ],
          issuerRules: [],
      } as unknown as Card & {
        velocityRules: { id: string; cardId: string; maxApplications: number; periodDays: number; isActive: boolean; }[];
        churningRules: { id: string; cardId: string; bonusCooldown: number; isActive: boolean; }[];
        issuerRules: { id: string; issuerId: string; maxCards: number; cooldownPeriod: number; isActive: boolean; }[];
      };

      prismaMock.card.findUnique.mockResolvedValueOnce(mockCardWithRules);
      prismaMock.cardApplication.create.mockResolvedValueOnce(mockApplication);

      const result = await caller.card.applyForCard({
        cardId: 'test-card',
        creditScore: 750,
        notes: 'Test application',
      });

      expect(result).toEqual(mockApplication);
    });

    test('should throw error if credit score too low', async () => {
      const caller = await createCaller();

      const mockCardWithRules = {
          ...mockCard,
          creditScoreMin: 740,
          issuerRules: [],
      } as unknown as Card & {
        issuerRules: { id: string; issuerId: string; maxCards: number; cooldownPeriod: number; isActive: boolean; }[];
      };

      prismaMock.card.findUnique.mockResolvedValueOnce(mockCardWithRules);

      await expect(
        caller.card.applyForCard({
          cardId: 'test-card',
          creditScore: 700,
          notes: 'Test application',
        })
      ).rejects.toThrow('Credit score too low');
    });

    test('should pass if credit score meets minimum', async () => {
      const caller = await createCaller();

      const mockCardWithRules = {
          ...mockCard,
          creditScoreMin: 740,
          issuerRules: [],
      } as unknown as Card & {
        issuerRules: { id: string; issuerId: string; maxCards: number; cooldownPeriod: number; isActive: boolean; }[];
      };

      prismaMock.card.findUnique.mockResolvedValueOnce(mockCardWithRules);
      prismaMock.cardApplication.create.mockResolvedValueOnce(mockApplication);

      const result = await caller.card.applyForCard({
        cardId: 'test-card',
        creditScore: 750,
        notes: 'Test application',
      });

      expect(result).toEqual(mockApplication);
    });
  });

  describe('updateStatus', () => {
    test('should update to approved status with spend deadline', async () => {
      const caller = await createCaller();
      const mockApplicationWithCard = {
        ...mockApplication,
        card: {
          ...mockCard,
          minSpend: 4000,
          minSpendPeriod: 3,
        },
      };

      prismaMock.cardApplication.findUnique.mockResolvedValueOnce(mockApplicationWithCard);
      
      const expectedDeadline = new Date();
      expectedDeadline.setMonth(expectedDeadline.getMonth() + 3);
      
      prismaMock.cardApplication.update.mockResolvedValueOnce({
        ...mockApplication,
        status: CardStatus.APPROVED,
        approvedAt: new Date(),
        spendDeadline: expectedDeadline,
      });

      const result = await caller.card.updateStatus({
        applicationId: 'test-application',
        status: CardStatus.APPROVED,
      });

      expect(result.status).toBe(CardStatus.APPROVED);
      expect(result.approvedAt).toBeDefined();
      expect(result.spendDeadline).toBeDefined();
    });

    test('should update to cancelled status', async () => {
      const caller = await createCaller();
      
      prismaMock.cardApplication.findUnique.mockResolvedValueOnce(mockApplication);
      prismaMock.cardApplication.update.mockResolvedValueOnce({
        ...mockApplication,
        status: CardStatus.CANCELLED,
        closedAt: new Date(),
        notes: 'Cancelled due to better offer',
      });

      const result = await caller.card.updateStatus({
        applicationId: 'test-application',
        status: CardStatus.CANCELLED,
        notes: 'Cancelled due to better offer',
      });

      expect(result.status).toBe(CardStatus.CANCELLED);
      expect(result.closedAt).toBeDefined();
      expect(result.notes).toBe('Cancelled due to better offer');
    });

    test('should throw error if application not found', async () => {
      const caller = await createCaller();
      
      prismaMock.cardApplication.findUnique.mockResolvedValueOnce(null);

      await expect(
        caller.card.updateStatus({
          applicationId: 'non-existent',
          status: CardStatus.APPROVED,
        })
      ).rejects.toThrow('Application not found');
    });

    test('should throw error if application belongs to another user', async () => {
      const caller = await createCaller();
      
      prismaMock.cardApplication.findUnique.mockResolvedValueOnce({
        ...mockApplication,
        userId: 'other-user',
      });

      await expect(
        caller.card.updateStatus({
          applicationId: 'test-application',
          status: CardStatus.APPROVED,
        })
      ).rejects.toThrow('Application not found');
    });
  });

  describe('getApplications', () => {
    test('should return paginated applications', async () => {
      const caller = await createCaller();

      const mockApplications = [
        mockApplication,
        { ...mockApplication, id: 'test-application-2' },
      ];
      prismaMock.cardApplication.findMany.mockResolvedValueOnce(mockApplications);

      const result = await caller.card.getApplications({
        limit: 1,
      });

      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).toBe('test-application-2');
      expect(prismaMock.cardApplication.findMany).toHaveBeenCalledWith({
        where: { userId: 'test-user' },
        take: 2,
        cursor: undefined,
        include: {
          card: true,
          retentionOffers: true,
        },
        orderBy: {
          appliedAt: 'desc',
        },
      });
    });

    test('should handle cursor-based pagination', async () => {
      const caller = await createCaller();

      prismaMock.cardApplication.findMany.mockResolvedValueOnce([mockApplication]);

      const result = await caller.card.getApplications({
        limit: 10,
        cursor: 'test-cursor',
      });

      expect(result.nextCursor).toBeUndefined();
      expect(prismaMock.cardApplication.findMany).toHaveBeenCalledWith({
        where: { userId: 'test-user' },
        take: 11,
        cursor: { id: 'test-cursor' },
        include: {
          card: true,
          retentionOffers: true,
        },
        orderBy: {
          appliedAt: 'desc',
        },
      });
    });

    test('should return empty array when no applications exist', async () => {
      const caller = await createCaller();

      prismaMock.cardApplication.findMany.mockResolvedValueOnce([]);

      const result = await caller.card.getApplications({
        limit: 10,
      });

      expect(result.items).toHaveLength(0);
      expect(result.nextCursor).toBeUndefined();
    });

    test('should include card and retention offers in response', async () => {
      const caller = await createCaller();

      const mockApplicationWithRelations = {
        ...mockApplication,
        card: mockCard,
        retentionOffers: [mockRetentionOffer],
      };

      prismaMock.cardApplication.findMany.mockResolvedValueOnce([mockApplicationWithRelations]);

      const result = await caller.card.getApplications({
        limit: 10,
      });

      expect(result.items[0].card).toBeDefined();
      expect(result.items[0].retentionOffers).toHaveLength(1);
    });

    test('should get user applications with pagination', async () => {
      const caller = await createCaller();
      const mockApplications = [
        { ...mockApplication, id: '1' },
        { ...mockApplication, id: '2' },
        { ...mockApplication, id: '3' },
      ];

      prismaMock.cardApplication.findMany.mockResolvedValueOnce(mockApplications);

      const result = await caller.card.getApplications({ limit: 2 });

      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBe('3');
      expect(prismaMock.cardApplication.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'test-user' },
          take: 3,
          include: {
            card: true,
            retentionOffers: true,
          },
        })
      );
    });

    test('should handle empty results', async () => {
      const caller = await createCaller();
      prismaMock.cardApplication.findMany.mockResolvedValueOnce([]);

      const result = await caller.card.getApplications({ limit: 10 });

      expect(result.items).toHaveLength(0);
      expect(result.nextCursor).toBeUndefined();
    });
  });

  describe('checkEligibility', () => {
    test('should return eligible if all criteria met', async () => {
      const caller = await createCaller();

      const mockCardWithRules = {
          ...mockCard,
          issuerRules: [],
      } as unknown as Card;

      prismaMock.card.findUnique.mockResolvedValueOnce(mockCardWithRules);
      prismaMock.cardApplication.count.mockResolvedValueOnce(0); // For issuer cards check
      prismaMock.cardApplication.count.mockResolvedValueOnce(0); // For velocity check
      prismaMock.cardApplication.findFirst.mockResolvedValueOnce(null); // For cooldown check
      prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);

      const result = await caller.card.checkEligibility({
        cardId: 'test-card',
        creditScore: 750,
      });

      expect(result.eligible).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    test('should return violations if credit score too low', async () => {
      const caller = await createCaller();

      const mockCardWithRules = {
          ...mockCard,
          creditScoreMin: 740,
          issuerRules: [],
      } as unknown as Card;

      prismaMock.card.findUnique.mockResolvedValueOnce(mockCardWithRules);
      prismaMock.cardApplication.count.mockResolvedValueOnce(0); // For issuer cards check
      prismaMock.cardApplication.count.mockResolvedValueOnce(0); // For velocity check
      prismaMock.cardApplication.findFirst.mockResolvedValueOnce(null); // For cooldown check
      prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);

      const result = await caller.card.checkEligibility({
        cardId: 'test-card',
        creditScore: 700,
      });

      expect(result.eligible).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toEqual({
        rule: 'Credit Score',
        message: 'Minimum credit score required: 740',
      });
    });

    test('should throw error if card not found', async () => {
      const caller = await createCaller();

      prismaMock.card.findUnique.mockResolvedValueOnce(null);

      await expect(
        caller.card.checkEligibility({
          cardId: 'non-existent',
        })
      ).rejects.toThrow('Card not found');
    });

    test('should return violations if exceeding issuer max cards', async () => {
      const caller = await createCaller();

      const mockCardWithRules = {
          ...mockCard,
          issuerRules: [
              {
                  id: 'rule-1',
                  issuerId: 'test-issuer',
                  maxCards: 5,
                  cooldownPeriod: 30,
                  isActive: true,
              },
          ],
      } as unknown as Card & {
        issuerRules: { id: string; issuerId: string; maxCards: number; cooldownPeriod: number; isActive: boolean; }[];
      };

      prismaMock.card.findUnique.mockResolvedValueOnce(mockCardWithRules);
      prismaMock.cardApplication.count.mockResolvedValueOnce(5);

      const result = await caller.card.checkEligibility({
        cardId: 'test-card',
        creditScore: 750,
      });

      expect(result.eligible).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toEqual({
        rule: 'Maximum Cards',
        message: 'Maximum of 5 cards allowed from this issuer',
      });
    });

    test('should return violations if within cooldown period', async () => {
      const caller = await createCaller();

      const mockCardWithRules = {
          ...mockCard,
          issuerRules: [
              {
                  id: 'rule-1',
                  issuerId: 'test-issuer',
                  maxCards: 5,
                  cooldownPeriod: 30,
                  isActive: true,
              },
          ],
      } as unknown as Card & {
        issuerRules: { id: string; issuerId: string; maxCards: number; cooldownPeriod: number; isActive: boolean; }[];
      };

      prismaMock.card.findUnique.mockResolvedValueOnce(mockCardWithRules);
      prismaMock.cardApplication.findFirst.mockResolvedValueOnce(mockApplication);

      const result = await caller.card.checkEligibility({
        cardId: 'test-card',
        creditScore: 750,
      });

      expect(result.eligible).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toEqual({
        rule: 'Application Cooldown',
        message: 'Must wait 30 days between applications',
      });
    });

    test('should ignore inactive issuer rules', async () => {
      const caller = await createCaller();

      const mockCardWithRules = {
          ...mockCard,
          issuerRules: [
              {
                  id: 'rule-1',
                  issuerId: 'test-issuer',
                  maxCards: 5,
                  cooldownPeriod: 30,
                  isActive: false,
              },
          ],
      } as unknown as Card & {
        issuerRules: { id: string; issuerId: string; maxCards: number; cooldownPeriod: number; isActive: boolean; }[];
      };

      prismaMock.card.findUnique.mockResolvedValueOnce(mockCardWithRules);

      const result = await caller.card.checkEligibility({
        cardId: 'test-card',
        creditScore: 750,
      });

      expect(result.eligible).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    test('should check velocity rules', async () => {
      const caller = await createCaller();

      const mockCardWithRules = {
          ...mockCard,
          issuerRules: [],
      } as unknown as Card & {
        issuerRules: { id: string; issuerId: string; maxCards: number; cooldownPeriod: number; isActive: boolean; }[];
      };

      prismaMock.card.findUnique.mockResolvedValueOnce(mockCardWithRules);
      
      // Mock the count for velocity check
      prismaMock.cardApplication.count.mockResolvedValueOnce(0) // For issuer cards check
        .mockResolvedValueOnce(3); // For velocity check (> 2 applications in 30 days)
      
      // Mock no recent application for cooldown check
      prismaMock.cardApplication.findFirst.mockResolvedValueOnce(null);

      const result = await caller.card.checkEligibility({
        cardId: 'test-card',
        creditScore: 750,
      });

      expect(result.eligible).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toEqual({
        rule: 'Velocity Rule',
        message: 'Maximum of 2 applications allowed in 30 days',
      });
    });

    test('should check churning rules', async () => {
      const caller = await createCaller();

      const mockCardWithRules = {
          ...mockCard,
          churningRules: [
              {
                  id: 'rule-1',
                  cardId: 'test-card',
                  bonusCooldown: 48,
                  isActive: true,
              },
          ],
          issuerRules: [],
      } as unknown as Card & {
        churningRules: { id: string; cardId: string; bonusCooldown: number; isActive: boolean; }[];
        issuerRules: { id: string; issuerId: string; maxCards: number; cooldownPeriod: number; isActive: boolean; }[];
      };

      prismaMock.card.findUnique.mockResolvedValueOnce(mockCardWithRules);
      prismaMock.cardApplication.count.mockResolvedValueOnce(0);
      prismaMock.cardApplication.findFirst.mockResolvedValueOnce({
        ...mockApplication,
        bonusEarnedAt: new Date(),
      });

      const result = await caller.card.checkEligibility({
        cardId: 'test-card',
        creditScore: 750,
      });

      expect(result.eligible).toBe(false);
      expect(result.violations).toContainEqual({
        rule: 'Application Cooldown',
        message: 'Must wait 30 days between applications',
      });
    });

    test('should check business card requirements', async () => {
      const caller = await createCaller();

      const mockBusinessCard = {
          ...mockCard,
          businessCard: true,
          issuerRules: [],
      } as unknown as Card & {
        issuerRules: { id: string; issuerId: string; maxCards: number; cooldownPeriod: number; isActive: boolean; }[];
      };

      prismaMock.card.findUnique.mockResolvedValueOnce(mockBusinessCard);

      const result = await caller.card.checkEligibility({
        cardId: 'test-card',
        creditScore: 750,
      });

      expect(result.eligible).toBe(false);
      expect(result.violations).toContainEqual({
        rule: 'Business Card',
        message: 'Business verification required',
      });
    });

    test('should check eligibility successfully', async () => {
      const caller = await createCaller();
      const mockCardWithRules = {
        ...mockCard,
        issuerRules: [],
      };

      prismaMock.card.findUnique.mockResolvedValueOnce(mockCardWithRules);
      prismaMock.cardApplication.count.mockResolvedValue(0);
      prismaMock.cardApplication.findFirst.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'test-user',
        firebaseUid: 'test-firebase-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
        creditScore: null,
        monthlyIncome: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        householdId: null,
        businessVerified: true,
      } as MockUser);

      const result = await caller.card.checkEligibility({
        cardId: 'test-card',
        creditScore: 750,
      });

      expect(result.eligible).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    test('should identify all violations', async () => {
      const caller = await createCaller();
      const mockCardWithRules = {
          ...mockCard,
          creditScoreMin: 750,
          businessCard: true,
          issuerRules: [
              {
                  id: 'rule-1',
                  issuerId: 'test-issuer',
                  maxCards: 5,
                  cooldownPeriod: 30,
                  isActive: true,
              },
          ],
      } as unknown as Card & {
        issuerRules: { id: string; issuerId: string; maxCards: number; cooldownPeriod: number; isActive: boolean; }[];
      };

      prismaMock.card.findUnique.mockResolvedValueOnce(mockCardWithRules);
      
      // Mock max cards violation
      prismaMock.cardApplication.count.mockResolvedValueOnce(5) // For issuer rules
        .mockResolvedValueOnce(3); // For velocity rules
      
      // Mock cooldown violation
      prismaMock.cardApplication.findFirst.mockResolvedValueOnce({
        ...mockApplication,
        appliedAt: new Date(), // Recent application
      });

      // Mock business verification
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 'test-user',
        firebaseUid: 'test-firebase-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
        creditScore: null,
        monthlyIncome: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        householdId: null,
        businessVerified: false,
      } as MockUser);

      const result = await caller.card.checkEligibility({
        cardId: 'test-card',
        creditScore: 700, // Below minimum
      });

      expect(result.eligible).toBe(false);
      expect(result.violations).toContainEqual({
        rule: 'Maximum Cards',
        message: 'Maximum of 5 cards allowed from this issuer',
      });
      expect(result.violations).toContainEqual({
        rule: 'Application Cooldown',
        message: 'Must wait 30 days between applications',
      });
      expect(result.violations).toContainEqual({
        rule: 'Velocity Rule',
        message: 'Maximum of 2 applications allowed in 30 days',
      });
      expect(result.violations).toContainEqual({
        rule: 'Business Card',
        message: 'Business verification required',
      });
      expect(result.violations).toContainEqual({
        rule: 'Credit Score',
        message: 'Minimum credit score required: 750',
      });
    });
  });

  describe('updateSpend', () => {
    test('should update spend progress and earn bonus', async () => {
      const caller = await createCaller();
      const mockApplicationWithCard = {
          ...mockApplication,
          status: CardStatus.APPROVED,
          card: {
              ...mockCard,
              minSpend: 3000,
          },
      } as unknown as MockApplicationWithCard;

      prismaMock.cardApplication.findUnique.mockResolvedValueOnce(mockApplicationWithCard);
      prismaMock.cardApplication.update.mockResolvedValueOnce({
        ...mockApplicationWithCard,
        spendProgress: 3500,
        bonusEarnedAt: new Date(),
      });

      const result = await caller.card.updateSpend({
        applicationId: 'test-application',
        amount: 3500,
        date: new Date(),
      });

      expect(result.spendProgress).toBe(3500);
      expect(result.bonusEarnedAt).toBeDefined();
    });

    test('should not earn bonus if spend requirement not met', async () => {
      const caller = await createCaller();
      const mockApplicationWithCard = {
          ...mockApplication,
          status: CardStatus.APPROVED,
          card: {
              ...mockCard,
              minSpend: 4000,
          },
      } as unknown as MockApplicationWithCard;

      prismaMock.cardApplication.findUnique.mockResolvedValueOnce(mockApplicationWithCard);
      prismaMock.cardApplication.update.mockResolvedValueOnce({
        ...mockApplicationWithCard,
        spendProgress: 2000,
      });

      const result = await caller.card.updateSpend({
        applicationId: 'test-application',
        amount: 2000,
        date: new Date(),
      });

      expect(result.spendProgress).toBe(2000);
      expect(result.bonusEarnedAt).toBeNull();
    });

    test('should throw error if application not approved', async () => {
      const caller = await createCaller();
      
      prismaMock.cardApplication.findUnique.mockResolvedValueOnce({
          ...mockApplication,
          status: CardStatus.PENDING,
          card: mockCard,
      } as unknown as MockApplicationWithCard);

      await expect(
        caller.card.updateSpend({
          applicationId: 'test-application',
          amount: 1000,
          date: new Date(),
        })
      ).rejects.toThrow('Cannot track spend for non-approved applications');
    });

    test('should throw error if spend date after deadline', async () => {
      const caller = await createCaller();
      const deadline = new Date();
      deadline.setDate(deadline.getDate() - 1); // Yesterday

      const mockApplicationWithCard = {
          ...mockApplication,
          status: CardStatus.APPROVED,
          spendDeadline: deadline,
          card: mockCard,
      } as unknown as MockApplicationWithCard;

      prismaMock.cardApplication.findUnique.mockResolvedValueOnce(mockApplicationWithCard);

      await expect(
        caller.card.updateSpend({
          applicationId: 'test-application',
          amount: 1000,
          date: new Date(),
        })
      ).rejects.toThrow('Spend date is after bonus deadline');
    });
  });

  describe('addRetentionOffer', () => {
    test('should add retention offer successfully', async () => {
      const caller = await createCaller();
      
      prismaMock.cardApplication.findUnique.mockResolvedValueOnce(mockApplication);
      prismaMock.retentionOffer.create.mockResolvedValueOnce(mockRetentionOffer);

      const result = await caller.card.addRetentionOffer({
        applicationId: 'test-application',
        pointsOffered: 10000,
        notes: 'Test offer',
      });

      expect(result).toEqual(mockRetentionOffer);
    });

    test('should require either points or statement credit', async () => {
      const caller = await createCaller();

      await expect(
        caller.card.addRetentionOffer({
          applicationId: 'test-application',
          spendRequired: 1000,
          notes: 'Test offer',
        })
      ).rejects.toThrow('Must specify either points or statement credit');
    });
  });
}); 
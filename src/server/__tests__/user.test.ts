import { PrismaClient } from '@prisma/client';
import { DecodedIdToken } from 'firebase-admin/auth';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { Context } from '../context';
import { appRouter } from '../routers/_app';

describe('User Router', () => {
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

  describe('me', () => {
    it('returns user profile', async () => {
      const mockUser = {
        id: '1',
        firebaseUid: mockSession.uid,
        email: 'test@example.com',
        displayName: 'Test User',
        customDisplayName: null,
        photoURL: 'https://example.com/photo.jpg',
        role: 'user' as const,
        status: 'active',
        creditScore: null,
        monthlyIncome: null,
        businessVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        householdId: null,
      };

      ctx.prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await caller.user.me();
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('updates user profile', async () => {
      const mockUser = {
        id: '1',
        firebaseUid: mockSession.uid,
        email: 'test@example.com',
        displayName: 'Updated User',
        customDisplayName: null,
        photoURL: 'https://example.com/new-photo.jpg',
        role: 'user' as const,
        status: 'active',
        creditScore: null,
        monthlyIncome: null,
        businessVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        householdId: null,
      };

      ctx.prisma.user.update.mockResolvedValue(mockUser);

      const result = await caller.user.update({
        displayName: 'Updated User',
        email: 'test@example.com',
        photoURL: 'https://example.com/new-photo.jpg',
      });

      expect(result).toEqual(mockUser);
    });
  });

  describe('delete', () => {
    it('deletes user profile', async () => {
      ctx.prisma.user.delete.mockResolvedValue({
        id: '1',
        firebaseUid: mockSession.uid,
        email: 'test@example.com',
        displayName: 'Test User',
        customDisplayName: null,
        photoURL: 'https://example.com/photo.jpg',
        role: 'user' as const,
        status: 'active',
        creditScore: null,
        monthlyIncome: null,
        businessVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        householdId: null,
      });

      const result = await caller.user.delete();
      expect(result).toEqual({ success: true });
    });
  });
});

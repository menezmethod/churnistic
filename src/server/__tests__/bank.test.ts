import { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { DecodedIdToken } from 'firebase-admin/auth';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { Context } from '../context';
import { appRouter } from '../routers/_app';

describe('Bank Router', () => {
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

  describe('getAll', () => {
    it('returns all banks', async () => {
      const mockBanks = [
        {
          id: '1',
          name: 'Test Bank',
          website: 'https://example.com',
          logo: 'https://example.com/logo.png',
        },
      ];

      ctx.prisma.bank.findMany.mockResolvedValue(mockBanks);

      const result = await caller.bank.getAll();
      expect(result).toEqual(mockBanks);
    });
  });

  describe('getById', () => {
    it('returns a bank by id', async () => {
      const mockBank = {
        id: '1',
        name: 'Test Bank',
        website: 'https://example.com',
        logo: 'https://example.com/logo.png',
      };

      ctx.prisma.bank.findUnique.mockResolvedValue(mockBank);

      const result = await caller.bank.getById(mockBank.id);
      expect(result).toEqual(mockBank);
    });

    it('throws error when bank not found', async () => {
      ctx.prisma.bank.findUnique.mockResolvedValue(null);

      await expect(caller.bank.getById('non-existent')).rejects.toThrow(
        new TRPCError({
          code: 'NOT_FOUND',
          message: 'Bank not found',
        })
      );
    });
  });

  describe('create', () => {
    it('creates a bank', async () => {
      const mockBank = {
        id: '1',
        name: 'Test Bank',
        website: 'https://example.com',
        logo: 'https://example.com/logo.png',
      };

      ctx.prisma.bank.create.mockResolvedValue(mockBank);

      const result = await caller.bank.create({
        name: 'Test Bank',
        website: 'https://example.com',
        logo: 'https://example.com/logo.png',
      });

      expect(result).toEqual(mockBank);
    });
  });

  describe('update', () => {
    it('updates a bank', async () => {
      const mockBank = {
        id: '1',
        name: 'Updated Bank',
        website: 'https://example.com',
        logo: 'https://example.com/logo.png',
      };

      ctx.prisma.bank.update.mockResolvedValue(mockBank);

      const result = await caller.bank.update({
        id: mockBank.id,
        name: 'Updated Bank',
      });

      expect(result).toEqual(mockBank);
    });
  });

  describe('delete', () => {
    it('deletes a bank', async () => {
      const mockBank = {
        id: '1',
        name: 'Test Bank',
        website: 'https://example.com',
        logo: 'https://example.com/logo.png',
      };

      ctx.prisma.bank.delete.mockResolvedValue(mockBank);

      const result = await caller.bank.delete(mockBank.id);
      expect(result).toEqual(mockBank);
    });
  });
});

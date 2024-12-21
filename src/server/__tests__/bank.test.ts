import { PrismaClient } from '@prisma/client';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { Context } from '../context';
import { appRouter } from '../routers/_app';

describe('Bank Router', () => {
  let ctx: {
    prisma: DeepMockProxy<PrismaClient>;
    session: { uid: string };
    user: DecodedIdToken;
  };
  let caller: ReturnType<typeof appRouter.createCaller>;

  const mockBanks = [
    {
      id: '1',
      name: 'Test Bank 1',
      website: 'https://bank1.com',
      chexSystemsSensitive: false,
      earlyTermFee: null,
      earlyTermPeriod: null,
      bonusCooldown: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'Test Bank 2',
      website: 'https://bank2.com',
      chexSystemsSensitive: false,
      earlyTermFee: null,
      earlyTermPeriod: null,
      bonusCooldown: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockBank = {
    id: '1',
    name: 'Test Bank',
    website: 'https://bank.com',
    chexSystemsSensitive: false,
    earlyTermFee: null,
    earlyTermPeriod: null,
    bonusCooldown: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    ctx = {
      prisma: mockDeep<PrismaClient>(),
      session: { uid: 'test-uid' },
      user: {
        uid: 'test-uid',
        email: 'test@example.com',
        email_verified: true,
        auth_time: 0,
        iat: 0,
        exp: 0,
        sub: 'test-uid',
        firebase: {
          identities: {},
          sign_in_provider: 'custom',
        },
      },
    };
    caller = appRouter.createCaller(ctx as Context);
  });

  describe('getAll', () => {
    it('returns list of banks', async () => {
      ctx.prisma.bank.findMany.mockResolvedValue(mockBanks);

      const result = await caller.bank.getAll();
      expect(result).toEqual(mockBanks);
    });
  });

  describe('getById', () => {
    it('returns bank by id', async () => {
      ctx.prisma.bank.findUnique.mockResolvedValue(mockBank);

      const result = await caller.bank.getById('1');
      expect(result).toEqual(mockBank);
    });

    it('throws error if bank not found', async () => {
      ctx.prisma.bank.findUnique.mockResolvedValue(null);

      await expect(caller.bank.getById('1')).rejects.toThrow('Bank not found');
    });
  });

  describe('create', () => {
    it('creates new bank', async () => {
      ctx.prisma.bank.create.mockResolvedValue(mockBank);

      const result = await caller.bank.create({
        name: 'Test Bank',
        website: 'https://bank.com',
      });

      expect(result).toEqual(mockBank);
    });
  });

  describe('update', () => {
    it('updates bank', async () => {
      ctx.prisma.bank.update.mockResolvedValue(mockBank);

      const result = await caller.bank.update({
        id: '1',
        name: 'Updated Bank',
        website: 'https://updated-bank.com',
      });

      expect(result).toEqual(mockBank);
    });

    it('throws error if bank not found', async () => {
      ctx.prisma.bank.update.mockRejectedValue(new Error('Bank not found'));

      await expect(
        caller.bank.update({
          id: '1',
          name: 'Updated Bank',
          website: 'https://updated-bank.com',
        })
      ).rejects.toThrow('Bank not found');
    });
  });

  describe('delete', () => {
    it('deletes bank', async () => {
      ctx.prisma.bank.delete.mockResolvedValue(mockBank);

      const result = await caller.bank.delete('1');
      expect(result).toEqual(mockBank);
    });

    it('throws error if bank not found', async () => {
      ctx.prisma.bank.delete.mockRejectedValue(new Error('Bank not found'));

      await expect(caller.bank.delete('1')).rejects.toThrow('Bank not found');
    });
  });
});

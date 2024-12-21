import { PrismaClient } from '@prisma/client';
import { DecodedIdToken } from 'firebase-admin/auth';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

import { Context } from '../../context';
import { appRouter } from '../_app';

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
          website: 'https://testbank.com',
          chexSystemsSensitive: false,
          earlyTermFee: null,
          earlyTermPeriod: null,
          bonusCooldown: null,
          createdAt: new Date(),
          updatedAt: new Date(),
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
        website: 'https://testbank.com',
        chexSystemsSensitive: false,
        earlyTermFee: null,
        earlyTermPeriod: null,
        bonusCooldown: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      ctx.prisma.bank.findUnique.mockResolvedValue(mockBank);

      const result = await caller.bank.getById('1');
      expect(result).toEqual(mockBank);
    });

    it('throws an error if bank is not found', async () => {
      ctx.prisma.bank.findUnique.mockResolvedValue(null);

      await expect(caller.bank.getById('1')).rejects.toThrow('Bank not found');
    });
  });

  describe('create', () => {
    it('creates a new bank', async () => {
      const mockInput = {
        name: 'New Bank',
        website: 'https://newbank.com',
      };

      const mockBank = {
        id: '1',
        ...mockInput,
        chexSystemsSensitive: false,
        earlyTermFee: null,
        earlyTermPeriod: null,
        bonusCooldown: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      ctx.prisma.bank.create.mockResolvedValue(mockBank);

      const result = await caller.bank.create(mockInput);
      expect(result).toEqual({
        ...mockBank,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('update', () => {
    it('updates a bank', async () => {
      const mockInput = {
        id: '1',
        name: 'Updated Bank',
        website: 'https://updatedbank.com',
      };

      const mockBank = {
        ...mockInput,
        chexSystemsSensitive: false,
        earlyTermFee: null,
        earlyTermPeriod: null,
        bonusCooldown: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      ctx.prisma.bank.update.mockResolvedValue(mockBank);

      const result = await caller.bank.update(mockInput);
      expect(result).toEqual({
        ...mockBank,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('delete', () => {
    it('deletes a bank', async () => {
      const mockBank = {
        id: '1',
        name: 'Test Bank',
        website: 'https://testbank.com',
        chexSystemsSensitive: false,
        earlyTermFee: null,
        earlyTermPeriod: null,
        bonusCooldown: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      ctx.prisma.bank.delete.mockResolvedValue(mockBank);

      const result = await caller.bank.delete('1');
      expect(result).toEqual(mockBank);
    });
  });
});

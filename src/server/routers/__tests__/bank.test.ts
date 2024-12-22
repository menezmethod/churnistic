import { type PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { type NextRequest } from 'next/server';

import { type Session, UserRole } from '@/lib/auth/types';
import { type Context } from '@/server/context';
import { appRouter } from '@/server/routers/_app';

describe('Bank Router', () => {
  const mockPrisma = mockDeep<PrismaClient>();
  let caller: ReturnType<typeof appRouter.createCaller>;
  let ctx: Context;

  const mockUser: Session = {
    uid: 'test-id',
    email: 'test@example.com',
    role: UserRole.USER,
  };

  beforeEach(() => {
    ctx = {
      prisma: mockPrisma,
      session: mockUser,
      user: mockUser,
      req: {} as NextRequest,
      res: undefined,
    };
    caller = appRouter.createCaller(ctx);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockBank = (overrides = {}) => ({
    id: '1',
    name: 'Test Bank',
    website: 'https://testbank.com',
    chexSystemsSensitive: false,
    earlyTermFee: null,
    earlyTermPeriod: null,
    bonusCooldown: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  describe('getAll', () => {
    it('returns all banks', async () => {
      const mockBanks = [createMockBank()];

      mockPrisma.bank.findMany.mockResolvedValue(mockBanks);

      const result = await caller.bank.getAll();
      expect(result).toEqual(mockBanks);
      expect(mockPrisma.bank.findMany).toHaveBeenCalled();
    });

    it('throws unauthorized error when not logged in', async () => {
      ctx.session = null;
      caller = appRouter.createCaller(ctx);

      await expect(caller.bank.getAll()).rejects.toThrow('Not authenticated');
    });
  });

  describe('getById', () => {
    it('returns a bank by id', async () => {
      const mockBank = createMockBank();

      mockPrisma.bank.findUnique.mockResolvedValue(mockBank);

      const result = await caller.bank.getById('1');
      expect(result).toEqual(mockBank);
      expect(mockPrisma.bank.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('throws not found error for non-existent bank', async () => {
      mockPrisma.bank.findUnique.mockResolvedValue(null);

      await expect(caller.bank.getById('1')).rejects.toThrow('Bank not found');
    });

    it('throws unauthorized error when not logged in', async () => {
      ctx.session = null;
      caller = appRouter.createCaller(ctx);

      await expect(caller.bank.getById('1')).rejects.toThrow('Not authenticated');
    });
  });

  describe('create', () => {
    it('creates a new bank', async () => {
      const mockInput = {
        name: 'New Bank',
        website: 'https://newbank.com',
      };

      const mockBank = createMockBank({
        name: mockInput.name,
        website: mockInput.website,
      });

      mockPrisma.bank.create.mockResolvedValue(mockBank);

      const result = await caller.bank.create(mockInput);
      expect(result).toEqual(mockBank);
      expect(mockPrisma.bank.create).toHaveBeenCalledWith({
        data: mockInput,
      });
    });

    it('throws unauthorized error when not logged in', async () => {
      ctx.session = null;
      caller = appRouter.createCaller(ctx);

      await expect(
        caller.bank.create({
          name: 'New Bank',
          website: 'https://newbank.com',
        })
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('update', () => {
    it('updates a bank', async () => {
      const mockInput = {
        id: '1',
        name: 'Updated Bank',
        website: 'https://updatedbank.com',
      };

      const mockBank = createMockBank({
        name: mockInput.name,
        website: mockInput.website,
      });

      mockPrisma.bank.update.mockResolvedValue(mockBank);

      const result = await caller.bank.update(mockInput);
      expect(result).toEqual(mockBank);
      expect(mockPrisma.bank.update).toHaveBeenCalledWith({
        where: { id: mockInput.id },
        data: {
          name: mockInput.name,
          website: mockInput.website,
        },
      });
    });

    it('throws unauthorized error when not logged in', async () => {
      ctx.session = null;
      caller = appRouter.createCaller(ctx);

      await expect(
        caller.bank.update({
          id: '1',
          name: 'Updated Bank',
        })
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('delete', () => {
    it('deletes a bank', async () => {
      const mockBank = createMockBank();

      mockPrisma.bank.delete.mockResolvedValue(mockBank);

      const result = await caller.bank.delete('1');
      expect(result).toEqual(mockBank);
      expect(mockPrisma.bank.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('throws unauthorized error when not logged in', async () => {
      ctx.session = null;
      caller = appRouter.createCaller(ctx);

      await expect(caller.bank.delete('1')).rejects.toThrow('Not authenticated');
    });
  });
});

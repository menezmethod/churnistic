import { type PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { type NextRequest } from 'next/server';

import { type Session, UserRole } from '@/lib/auth/types';
import { type Context } from '@/server/context';
import { appRouter } from '@/server/routers/_app';

describe('User Router', () => {
  const mockPrisma = mockDeep<PrismaClient>();
  let caller: ReturnType<typeof appRouter.createCaller>;
  let ctx: Context;

  const createMockUser = (overrides = {}) => ({
    id: 'test-id',
    email: 'test@example.com',
    displayName: 'Test User',
    customDisplayName: null,
    photoURL: null,
    role: UserRole.USER,
    status: 'ACTIVE',
    firebaseUid: 'test-id',
    creditScore: null,
    householdId: null,
    monthlyIncome: null,
    businessVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const mockSession: Session = {
    uid: 'test-id',
    email: 'test@example.com',
    role: UserRole.USER,
  };

  const mockAdminSession: Session = {
    uid: 'admin-id',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
  };

  beforeEach(() => {
    ctx = {
      prisma: mockPrisma,
      session: mockSession,
      user: mockSession,
      req: {} as NextRequest,
      res: undefined,
    };
    caller = appRouter.createCaller(ctx);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('me', () => {
    it('returns the current user', async () => {
      const mockUser = createMockUser();
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);

      const result = await caller.user.me();

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockSession.uid },
      });
    });

    it('throws unauthorized error when not logged in', async () => {
      ctx.session = null;
      caller = appRouter.createCaller(ctx);

      await expect(caller.user.me()).rejects.toThrow('Not authenticated');
    });

    it('throws not found error when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(caller.user.me()).rejects.toThrow('User not found');
    });
  });

  describe('getById', () => {
    it('returns a user by id when admin', async () => {
      ctx.session = mockAdminSession;
      caller = appRouter.createCaller(ctx);

      const mockUser = createMockUser();
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);

      const result = await caller.user.getById({ id: 'test-id' });

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
    });

    it('throws unauthorized error when not admin', async () => {
      await expect(caller.user.getById({ id: 'test-id' })).rejects.toThrow(
        'Not authorized'
      );
    });

    it('throws not found error when user does not exist', async () => {
      ctx.session = mockAdminSession;
      caller = appRouter.createCaller(ctx);

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(caller.user.getById({ id: 'test-id' })).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('update', () => {
    const updateInput = {
      id: 'test-id',
      displayName: 'Updated User',
      email: 'updated@example.com',
    };

    it('allows user to update their own profile', async () => {
      const mockUser = createMockUser();
      const updatedUser = createMockUser({
        displayName: updateInput.displayName,
        email: updateInput.email,
      });

      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      mockPrisma.user.update.mockResolvedValueOnce(updatedUser);

      const result = await caller.user.update(updateInput);

      expect(result).toEqual(updatedUser);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: updateInput.id },
        data: {
          displayName: updateInput.displayName,
          email: updateInput.email,
        },
      });
    });

    it('allows admin to update any user profile', async () => {
      ctx.session = mockAdminSession;
      caller = appRouter.createCaller(ctx);

      const mockUser = createMockUser();
      const updatedUser = createMockUser({
        displayName: updateInput.displayName,
        email: updateInput.email,
      });

      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      mockPrisma.user.update.mockResolvedValueOnce(updatedUser);

      const result = await caller.user.update(updateInput);

      expect(result).toEqual(updatedUser);
    });

    it('throws unauthorized error when updating other user profile without admin rights', async () => {
      const otherUser = createMockUser({
        id: 'other-user-id',
        firebaseUid: 'other-user-id',
      });

      mockPrisma.user.findUnique.mockResolvedValueOnce(otherUser);

      await expect(
        caller.user.update({
          id: 'other-user-id',
          displayName: 'Updated User',
        })
      ).rejects.toThrow('Not authorized');
    });
  });

  describe('delete', () => {
    it('allows admin to delete user', async () => {
      ctx.session = mockAdminSession;
      caller = appRouter.createCaller(ctx);

      const mockUser = createMockUser();
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      mockPrisma.user.delete.mockResolvedValueOnce(mockUser);

      const result = await caller.user.delete({ id: 'test-id' });

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
    });

    it('throws unauthorized error when not admin', async () => {
      await expect(caller.user.delete({ id: 'test-id' })).rejects.toThrow(
        'Not authorized'
      );
    });

    it('throws not found error when user does not exist', async () => {
      ctx.session = mockAdminSession;
      caller = appRouter.createCaller(ctx);

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(caller.user.delete({ id: 'test-id' })).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('list', () => {
    it('returns all users for admin', async () => {
      ctx.session = mockAdminSession;
      caller = appRouter.createCaller(ctx);

      const mockUsers = [
        createMockUser(),
        createMockUser({
          id: 'user-2',
          email: 'user2@example.com',
          displayName: 'User 2',
          firebaseUid: 'user-2',
        }),
      ];

      mockPrisma.user.findMany.mockResolvedValueOnce(mockUsers);

      const result = await caller.user.list();

      expect(result).toEqual(mockUsers);
    });

    it('throws unauthorized error when not admin', async () => {
      await expect(caller.user.list()).rejects.toThrow('Not authorized');
    });

    it('supports search filter', async () => {
      ctx.session = mockAdminSession;
      caller = appRouter.createCaller(ctx);

      const mockUser = createMockUser();
      mockPrisma.user.findMany.mockResolvedValueOnce([mockUser]);

      const result = await caller.user.list({ search: 'test' });

      expect(result).toEqual([mockUser]);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { displayName: { contains: 'test', mode: 'insensitive' } },
            { email: { contains: 'test', mode: 'insensitive' } },
          ],
        },
      });
    });
  });
});

import { type Firestore } from 'firebase-admin/firestore';
import { type NextRequest } from 'next/server';

import { type Session, UserRole } from '@/lib/auth/types';
import { mockFirestore } from '@/mocks/firestore';
import { type Context } from '@/server/context';
import { appRouter } from '@/server/routers/_app';

jest.mock('@/lib/firebase/admin', () => ({
  db: mockFirestore,
}));

describe('User Router', () => {
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
      db: mockFirestore as unknown as Firestore,
      session: mockSession,
      user: mockSession,
      req: {} as NextRequest,
      res: undefined,
    };
    caller = appRouter.createCaller(ctx);
    jest.clearAllMocks();
  });

  describe('me', () => {
    it('returns the current user', async () => {
      const mockUser = createMockUser();
      const mockDoc = {
        exists: true,
        data: () => mockUser,
        id: mockUser.id,
      };
      (
        mockFirestore.collection('users').doc(mockSession.uid).get as jest.Mock
      ).mockResolvedValueOnce(mockDoc);

      const result = await caller.user.me();

      expect(result).toEqual(mockUser);
      expect(mockFirestore.collection('users').doc).toHaveBeenCalledWith(mockSession.uid);
    });

    it('throws unauthorized error when not logged in', async () => {
      ctx.session = null;
      caller = appRouter.createCaller(ctx);

      await expect(caller.user.me()).rejects.toThrow('Not authenticated');
    });

    it('throws not found error when user does not exist', async () => {
      const mockDoc = {
        exists: false,
      };
      (
        mockFirestore.collection('users').doc(mockSession.uid).get as jest.Mock
      ).mockResolvedValueOnce(mockDoc);

      await expect(caller.user.me()).rejects.toThrow('User not found');
    });
  });

  describe('getById', () => {
    it('returns a user by id when admin', async () => {
      ctx.session = mockAdminSession;
      caller = appRouter.createCaller(ctx);

      const mockUser = createMockUser();
      const mockDoc = {
        exists: true,
        data: () => mockUser,
        id: mockUser.id,
      };
      (
        mockFirestore.collection('users').doc('test-id').get as jest.Mock
      ).mockResolvedValueOnce(mockDoc);

      const result = await caller.user.getById({ id: 'test-id' });

      expect(result).toEqual(mockUser);
      expect(mockFirestore.collection('users').doc).toHaveBeenCalledWith('test-id');
    });

    it('throws unauthorized error when not admin', async () => {
      await expect(caller.user.getById({ id: 'test-id' })).rejects.toThrow(
        'Not authorized'
      );
    });

    it('throws not found error when user does not exist', async () => {
      ctx.session = mockAdminSession;
      caller = appRouter.createCaller(ctx);

      const mockDoc = {
        exists: false,
      };
      (
        mockFirestore.collection('users').doc('test-id').get as jest.Mock
      ).mockResolvedValueOnce(mockDoc);

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

      const mockDoc = {
        exists: true,
        data: () => mockUser,
        id: mockUser.id,
      };
      (
        mockFirestore.collection('users').doc('test-id').get as jest.Mock
      ).mockResolvedValueOnce(mockDoc);
      (
        mockFirestore.collection('users').doc('test-id').update as jest.Mock
      ).mockResolvedValueOnce(undefined);

      const result = await caller.user.update(updateInput);

      expect(result).toEqual(updatedUser);
      expect(mockFirestore.collection('users').doc).toHaveBeenCalledWith('test-id');
      expect(
        mockFirestore.collection('users').doc('test-id').update
      ).toHaveBeenCalledWith({
        displayName: updateInput.displayName,
        email: updateInput.email,
        updatedAt: expect.any(String),
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

      const mockDoc = {
        exists: true,
        data: () => mockUser,
        id: mockUser.id,
      };
      (
        mockFirestore.collection('users').doc('test-id').get as jest.Mock
      ).mockResolvedValueOnce(mockDoc);
      (
        mockFirestore.collection('users').doc('test-id').update as jest.Mock
      ).mockResolvedValueOnce(undefined);

      const result = await caller.user.update(updateInput);

      expect(result).toEqual(updatedUser);
    });

    it('throws unauthorized error when updating other user profile without admin rights', async () => {
      const otherUser = createMockUser({
        id: 'other-user-id',
        firebaseUid: 'other-user-id',
      });

      const mockDoc = {
        exists: true,
        data: () => otherUser,
        id: otherUser.id,
      };
      (
        mockFirestore.collection('users').doc('other-user-id').get as jest.Mock
      ).mockResolvedValueOnce(mockDoc);

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
      const mockDoc = {
        exists: true,
        data: () => mockUser,
        id: mockUser.id,
      };
      (
        mockFirestore.collection('users').doc('test-id').get as jest.Mock
      ).mockResolvedValueOnce(mockDoc);
      (
        mockFirestore.collection('users').doc('test-id').delete as jest.Mock
      ).mockResolvedValueOnce(undefined);

      const result = await caller.user.delete({ id: 'test-id' });

      expect(result).toEqual(mockUser);
      expect(mockFirestore.collection('users').doc).toHaveBeenCalledWith('test-id');
      expect(mockFirestore.collection('users').doc('test-id').delete).toHaveBeenCalled();
    });

    it('throws unauthorized error when not admin', async () => {
      await expect(caller.user.delete({ id: 'test-id' })).rejects.toThrow(
        'Not authorized'
      );
    });

    it('throws not found error when user does not exist', async () => {
      ctx.session = mockAdminSession;
      caller = appRouter.createCaller(ctx);

      const mockDoc = {
        exists: false,
      };
      (
        mockFirestore.collection('users').doc('test-id').get as jest.Mock
      ).mockResolvedValueOnce(mockDoc);

      await expect(caller.user.delete({ id: 'test-id' })).rejects.toThrow(
        'User not found'
      );
    });
  });
});

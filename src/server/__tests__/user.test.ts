import { describe, expect, test } from '@jest/globals';
import type { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import type { NextRequest } from 'next/server';

import { createContext } from '@/server/context';
import type { CreateContextOptions } from '@/server/context';
import { appRouter } from '@/server/routers/_app';
import type { User } from '@/types/user';

// Create mock instances
const prismaMock = mockDeep<PrismaClient>();

// Mock data
const mockUser: User = {
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

describe('User Router', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('me', () => {
    test('should return the current user', async () => {
      const caller = await createCaller();

      prismaMock.user.findUnique.mockResolvedValueOnce(mockUser);

      const result = await caller.user.me();

      expect(result).toEqual(mockUser);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { firebaseUid: 'test-user' },
      });
    });

    test('should throw error if user not found', async () => {
      const caller = await createCaller();

      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      await expect(caller.user.me()).rejects.toThrow('User not found');
    });
  });

  describe('create', () => {
    test('should create a new user', async () => {
      const caller = await createCaller();
      const input = {
        firebaseUid: 'new-user',
        email: 'new@example.com',
        displayName: 'New User',
        photoURL: 'https://example.com/new.jpg',
      };

      prismaMock.user.create.mockResolvedValueOnce({
        ...mockUser,
        ...input,
      });

      const result = await caller.user.create(input);

      expect(result).toMatchObject(input);
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: input,
      });
    });

    test('should create user with minimal required fields', async () => {
      const caller = await createCaller();
      const input = {
        firebaseUid: 'new-user',
        email: 'new@example.com',
      };

      prismaMock.user.create.mockResolvedValueOnce({
        ...mockUser,
        ...input,
        displayName: null,
        photoURL: null,
      });

      const result = await caller.user.create(input);

      expect(result).toMatchObject(input);
    });
  });

  describe('update', () => {
    test('should update user profile', async () => {
      const caller = await createCaller();
      const input = {
        displayName: 'Updated Name',
        photoURL: 'https://example.com/updated.jpg',
      };

      prismaMock.user.update.mockResolvedValueOnce({
        ...mockUser,
        ...input,
      });

      const result = await caller.user.update(input);

      expect(result).toMatchObject(input);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { firebaseUid: 'test-user' },
        data: input,
      });
    });

    test('should update partial fields', async () => {
      const caller = await createCaller();
      const input = {
        displayName: 'Updated Name',
      };

      prismaMock.user.update.mockResolvedValueOnce({
        ...mockUser,
        ...input,
      });

      const result = await caller.user.update(input);

      expect(result.displayName).toBe(input.displayName);
      expect(result.photoURL).toBe(mockUser.photoURL);
    });
  });

  describe('delete', () => {
    test('should delete user account', async () => {
      const caller = await createCaller();

      prismaMock.user.delete.mockResolvedValueOnce(mockUser);

      const result = await caller.user.delete();

      expect(result).toEqual(mockUser);
      expect(prismaMock.user.delete).toHaveBeenCalledWith({
        where: { firebaseUid: 'test-user' },
      });
    });

    test('should throw error if user not found', async () => {
      const caller = await createCaller();

      prismaMock.user.delete.mockRejectedValueOnce(new Error('User not found'));

      await expect(caller.user.delete()).rejects.toThrow('User not found');
    });
  });
});

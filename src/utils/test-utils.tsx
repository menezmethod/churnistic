import { type PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { type NextApiRequest, type NextApiResponse } from 'next';

import { type UserRole } from '@/lib/auth/types';
import { type Context } from '@/server/context';

export const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  role: 'USER' as UserRole,
};

export const mockPrisma = mockDeep<PrismaClient>();

export const mockReq = {} as NextApiRequest;
export const mockRes = {} as NextApiResponse;

export const createMockContext = (session = mockUser): Context => ({
  session,
  prisma: mockPrisma,
  req: mockReq,
  res: mockRes,
  user: session || null,
});

export const mockLocalStorage = () => {
  const store: { [key: string]: string } = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
  };
};

export const waitForPromises = async () => {
  // Wait for all promises in the microtask queue to resolve
  await new Promise((resolve) => setTimeout(resolve, 0));
  // Wait for the next tick to ensure all state updates are processed
  await new Promise((resolve) => process.nextTick(resolve));
};

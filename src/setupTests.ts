import '@testing-library/jest-dom';
import { mockDeep } from 'jest-mock-extended';
import type { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@/lib/prisma/db', () => ({
  prisma: mockDeep<PrismaClient>() as unknown as {
    [K in keyof PrismaClient]: PrismaClient[K] extends (..._: unknown[]) => unknown
      ? jest.Mock<ReturnType<PrismaClient[K]>, Parameters<PrismaClient[K]>>
      : PrismaClient[K] extends object
      ? {
          [P in keyof PrismaClient[K]]: PrismaClient[K][P] extends (..._: unknown[]) => unknown
            ? jest.Mock<ReturnType<PrismaClient[K][P]>, Parameters<PrismaClient[K][P]>>
            : PrismaClient[K][P];
        }
      : PrismaClient[K];
  },
})); 
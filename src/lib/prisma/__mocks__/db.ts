import type { PrismaClient } from '@prisma/client';
import type { DeepMockProxy } from 'jest-mock-extended';
import { mockDeep, mockReset } from 'jest-mock-extended';

export const prisma = mockDeep<PrismaClient>();

export type Context = {
  prisma: PrismaClient;
};

export type MockContext = {
  prisma: DeepMockProxy<PrismaClient>;
};

export const createMockContext = (): MockContext => {
  return {
    prisma: prisma,
  };
};

beforeEach(() => {
  mockReset(prisma);
});

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => prisma),
}));

import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

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

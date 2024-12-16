import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

export const prisma = mockDeep<PrismaClient>();
export type MockPrismaClient = DeepMockProxy<PrismaClient>; 
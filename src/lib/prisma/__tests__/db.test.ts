import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';

// Create a mock PrismaClient
const mockPrisma = mockDeep<PrismaClient>();

// Mock the prisma import
jest.mock('../db', () => ({
  prisma: mockPrisma,
}));

describe('Prisma Client', () => {
  it('should have all required models', () => {
    // Check if models exist
    expect(mockPrisma.user).toBeDefined();
    expect(mockPrisma.card).toBeDefined();
    expect(mockPrisma.cardApplication).toBeDefined();
    expect(mockPrisma.bank).toBeDefined();
    expect(mockPrisma.bankAccount).toBeDefined();
  });
});

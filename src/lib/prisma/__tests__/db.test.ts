import { PrismaClient } from '@prisma/client';

// Define valid model names
type PrismaModelName = keyof PrismaClient;

// Mock PrismaClient
const mockPrismaClient = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  card: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  cardApplication: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  bank: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  bankAccount: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
} as const;

// Mock PrismaClient constructor
const mockPrismaConstructor = jest.fn(() => mockPrismaClient);

jest.mock('@prisma/client', () => ({
  PrismaClient: mockPrismaConstructor,
}));

describe('Prisma Client', () => {
  let originalEnv: string | undefined;
  let globalForPrisma: { prisma?: unknown };

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    globalForPrisma = globalThis as unknown as { prisma?: unknown };
    delete globalForPrisma.prisma;
    mockPrismaConstructor.mockClear();
  });

  afterEach(() => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      configurable: true,
    });
    delete globalForPrisma.prisma;
    jest.resetModules();
  });

  it('creates a new PrismaClient instance', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      configurable: true,
    });
    const { prisma } = await import('../db');
    
    expect(prisma).toBeDefined();
    expect(mockPrismaConstructor).toHaveBeenCalledTimes(1);
    expect(prisma).toHaveProperty('user');
    expect(prisma).toHaveProperty('card');
    expect(prisma).toHaveProperty('cardApplication');
    expect(prisma).toHaveProperty('bank');
    expect(prisma).toHaveProperty('bankAccount');
  });

  it('reuses existing PrismaClient instance in non-production', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      configurable: true,
    });
    
    // First import
    const { prisma: prisma1 } = await import('../db');
    expect(mockPrismaConstructor).toHaveBeenCalledTimes(1);
    
    // Second import should reuse the same instance
    const { prisma: prisma2 } = await import('../db');
    expect(prisma2).toBe(prisma1);
    expect(mockPrismaConstructor).toHaveBeenCalledTimes(1);
  });

  it('creates new PrismaClient instance in production', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      configurable: true,
    });
    
    const { prisma } = await import('../db');
    expect(prisma).toBeDefined();
    expect(mockPrismaConstructor).toHaveBeenCalled();
    expect(prisma).toEqual(mockPrismaClient);
  });

  it('provides all required Prisma models', async () => {
    const { prisma } = await import('../db');
    const requiredModels: PrismaModelName[] = [
      'user',
      'card',
      'cardApplication',
      'bank',
      'bankAccount',
    ];

    requiredModels.forEach(model => {
      expect(prisma).toHaveProperty(model as string);
      expect(typeof (prisma as any)[model]).toBe('object');
    });
  });
}); 
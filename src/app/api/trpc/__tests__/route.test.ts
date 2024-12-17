import { describe, expect, test, jest } from '@jest/globals';
import { appRouter } from '@/server/routers/_app';
import { createContext } from '@/server/context';
import { NextRequest } from 'next/server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

// Mock request helper
const mockRequest = (): NextRequest => {
  return {
    headers: new Headers({
      'content-type': 'application/json',
    }),
    url: 'http://localhost:3000/api/trpc/test.query',
    method: 'GET',
  } as NextRequest;
};

// Mock Prisma
jest.mock('@/lib/prisma/db', () => {
  const mockPrisma = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  return { prisma: mockPrisma };
});

// Mock the fetchRequestHandler
jest.mock('@trpc/server/adapters/fetch', () => ({
  fetchRequestHandler: jest.fn().mockImplementation(async () => {
    const body = JSON.stringify({ result: { data: 'test' } });
    return new Response(body, {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }),
}));

describe('tRPC API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates context with prisma mock', async () => {
    const req = mockRequest();
    const context = await createContext(req);
    expect(context.prisma).toBeDefined();
  });

  test('handles tRPC requests', async () => {
    const req = mockRequest();
    const { GET } = await import('../[trpc]/route');
    
    const response = await GET(req);
    expect(response).toBeDefined();
    expect(fetchRequestHandler).toHaveBeenCalledWith({
      req,
      router: appRouter,
      createContext: expect.any(Function),
      endpoint: '/api/trpc',
      onError: expect.any(Function),
    });
  });
});

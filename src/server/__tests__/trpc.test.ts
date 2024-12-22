import type { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import type { NextRequest } from 'next/server';

import { type Session, UserRole } from '@/lib/auth/types';

import type { Context } from '../context';
import { appRouter } from '../routers/_app';

describe('tRPC Router', () => {
  const mockPrisma = mockDeep<PrismaClient>();
  const mockUser: Session = {
    uid: 'test-uid',
    email: 'test@example.com',
    role: UserRole.USER,
  };

  const createAuthContext = async (): Promise<Context> => {
    return {
      prisma: mockPrisma,
      session: mockUser,
      user: mockUser,
      req: {} as NextRequest,
      res: undefined,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a caller with auth context', async () => {
    const caller = appRouter.createCaller(await createAuthContext());
    expect(caller).toBeDefined();
  });
});

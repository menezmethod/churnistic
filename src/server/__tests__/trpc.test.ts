import type { PrismaClient } from '@prisma/client';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { mockDeep } from 'jest-mock-extended';

import type { Context } from '../context';
import { appRouter } from '../routers/_app';

describe('tRPC Router', () => {
  const mockPrisma = mockDeep<PrismaClient>();
  const mockUser: DecodedIdToken = {
    uid: 'test-uid',
    email: 'test@example.com',
    aud: 'test-audience',
    auth_time: Date.now(),
    exp: Date.now() + 3600,
    iat: Date.now(),
    iss: 'https://securetoken.google.com/test-project',
    sub: 'test-uid',
    firebase: {
      identities: {},
      sign_in_provider: 'custom',
    },
  };

  const createAuthContext = async (): Promise<Context> => {
    return {
      prisma: mockPrisma,
      session: {
        uid: mockUser.uid,
      },
      user: mockUser,
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

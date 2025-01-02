import { type Firestore } from 'firebase-admin/firestore';
import { mockDeep } from 'jest-mock-extended';
import { type NextRequest } from 'next/server';

import { type Session, UserRole } from '@/lib/auth/types';
import { type Context } from '@/server/context';
import { appRouter } from '@/server/routers/_app';

describe('TRPC Router', () => {
  const mockFirestore = mockDeep<Firestore>();
  let caller: ReturnType<typeof appRouter.createCaller>;
  let ctx: Context;

  const mockSession: Session = {
    uid: 'test-id',
    email: 'test@example.com',
    role: UserRole.USER,
  };

  beforeEach(() => {
    ctx = {
      db: mockFirestore,
      session: mockSession,
      user: mockSession,
      req: {} as NextRequest,
      res: undefined,
    };
    caller = appRouter.createCaller(ctx);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw unauthorized error when session is missing', async () => {
    ctx.session = null;
    caller = appRouter.createCaller(ctx);

    await expect(caller.user.me()).rejects.toThrow('Not authenticated');
  });
});

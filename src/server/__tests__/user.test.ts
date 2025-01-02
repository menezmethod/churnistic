import { jest } from '@jest/globals';

import { mockFirestore } from '@/mocks/firestore';
import { mockSession } from '@/mocks/session';

jest.mock('@/lib/firebase/admin', () => ({
  db: mockFirestore,
}));

describe('User Router', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('me', () => {
    it('should return the current user', async () => {
      const mockDoc = {
        exists: true,
        data: jest.fn().mockReturnValue({
          id: mockSession.uid,
          email: mockSession.email,
          role: 'user',
        }),
      };

      const getMock = jest.fn().mockResolvedValue(mockDoc);
      (mockFirestore.collection('users').doc as jest.Mock).mockReturnValue({
        get: getMock,
      });

      // Test implementation (add your test assertions here)
      // Example:
      // const caller = appRouter.createCaller({
      //   db: mockFirestore,
      //   session: mockSession,
      //   req: {} as NextRequest,
      //   res: undefined,
      // });
      // const result = await caller.user.me();
      // expect(result).toEqual(mockSession);
    });
  });

  // Other test cases...
});

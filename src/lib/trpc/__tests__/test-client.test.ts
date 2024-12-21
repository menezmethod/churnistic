import { TRPCError } from '@trpc/server';

import {
  trpc,
  testQuery,
  testMutation,
  testUserQuery,
  testCardQuery,
  testBankQuery,
} from '../test-client';

// Mock the trpc client
jest.mock('@trpc/client', () => ({
  createTRPCProxyClient: jest.fn(() => ({
    user: {
      me: {
        query: jest.fn(),
      },
    },
    card: {
      apply: {
        mutate: jest.fn(),
      },
    },
    bank: {
      getAll: {
        query: jest.fn(),
      },
    },
  })),
  httpBatchLink: jest.fn(),
}));

describe('TRPC Test Client', () => {
  describe('testQuery', () => {
    it('should execute query and match expected data', async () => {
      const expectedData = { id: 1, name: 'Test' };
      const queryFn = jest.fn().mockResolvedValue(expectedData);

      await testQuery(queryFn, expectedData);

      expect(queryFn).toHaveBeenCalled();
    });

    it('should execute query without expected data', async () => {
      const queryFn = jest.fn().mockResolvedValue({ id: 1 });

      await testQuery(queryFn);

      expect(queryFn).toHaveBeenCalled();
    });

    it('should test card query', async () => {
      const cardData = { eligible: true };
      (trpc.card.apply.mutate as jest.Mock).mockResolvedValue(cardData);
      const cardId = 'card123';

      await testCardQuery(cardId);

      expect(trpc.card.apply.mutate).toHaveBeenCalledWith({ cardId });
    });

    it('should test bank query', async () => {
      const bankData = [{ id: 'acc123', name: 'Test Bank' }];
      (trpc.bank.getAll.query as jest.Mock).mockResolvedValue(bankData);

      await testBankQuery();

      expect(trpc.bank.getAll.query).toHaveBeenCalled();
    });
  });

  describe('testMutation', () => {
    it('should execute mutation and match expected data', async () => {
      const expectedData = { id: 1, name: 'Test' };
      const mutationFn = jest.fn().mockResolvedValue(expectedData);

      await testMutation(mutationFn, expectedData);

      expect(mutationFn).toHaveBeenCalled();
    });

    it('should execute mutation without expected data', async () => {
      const mutationFn = jest.fn().mockResolvedValue({ id: 1 });

      await testMutation(mutationFn);

      expect(mutationFn).toHaveBeenCalled();
    });

    it('should handle TRPC error', async () => {
      const error = new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid input',
      });
      const mutationFn = jest.fn().mockRejectedValue(error);

      try {
        await testMutation(mutationFn);
        fail('Expected testMutation to throw an error');
      } catch (e) {
        expect(e).toEqual(new Error('Mutation failed: Invalid input'));
      }
    });

    it('should handle non-TRPC error', async () => {
      const error = new Error('Network error');
      const mutationFn = jest.fn().mockRejectedValue(error);

      try {
        await testMutation(mutationFn);
        fail('Expected testMutation to throw an error');
      } catch (e) {
        expect(e).toEqual(new Error('Network error'));
      }
    });
  });

  describe('Route-specific test helpers', () => {
    beforeEach(() => {
      // Reset all mocks before each test
      jest.clearAllMocks();
    });

    it('should test user query', async () => {
      const userData = { id: '1', email: 'test@example.com' };
      (trpc.user.me.query as jest.Mock).mockResolvedValue(userData);

      await testUserQuery();

      expect(trpc.user.me.query).toHaveBeenCalled();
    });

    it('should test card query', async () => {
      const cardData = { eligible: true };
      (trpc.card.apply.mutate as jest.Mock).mockResolvedValue(cardData);
      const cardId = 'card123';

      await testCardQuery(cardId);

      expect(trpc.card.apply.mutate).toHaveBeenCalledWith({ cardId });
    });

    it('should test bank query', async () => {
      const bankData = { id: 'acc123', name: 'Test Bank' };
      (trpc.bank.getById.query as jest.Mock).mockResolvedValue(bankData);
      const accountId = 'acc123';

      await testBankQuery();

      expect(trpc.bank.getById.query).toHaveBeenCalledWith(accountId);
    });
  });
});

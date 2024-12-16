import { httpBatchLink } from '@trpc/client';
import { appRouter } from '@/server/routers/_app';
import { createTRPCNext } from '@trpc/next';
import type { AppRouter } from '@/server/routers/_app';
import { TRPCError } from '@trpc/server';

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      links: [
        httpBatchLink({
          url: 'http://localhost:3000/api/trpc',
        }),
      ],
    };
  },
});

// Test helper functions
export async function testQuery<T>(
  queryFn: () => Promise<T>,
  expectedData?: T
): Promise<void> {
  try {
    const data = await queryFn();
    if (expectedData) {
      expect(data).toEqual(expectedData);
    }
  } catch (error) {
    if (error instanceof TRPCError) {
      throw new Error(`Query failed: ${error.message}`);
    }
    throw error;
  }
}

export async function testMutation<T>(
  mutationFn: () => Promise<T>,
  expectedData?: T
): Promise<void> {
  try {
    const data = await mutationFn();
    if (expectedData) {
      expect(data).toEqual(expectedData);
    }
  } catch (error) {
    if (error instanceof TRPCError) {
      throw new Error(`Mutation failed: ${error.message}`);
    }
    throw error;
  }
}

// Example test helpers for specific routes
export async function testUserQuery(userId: string) {
  return testQuery(async () => {
    const result = await trpc.user.me.useQuery().data;
    return result;
  });
}

export async function testCardQuery(cardId: string) {
  return testQuery(async () => trpc.card.checkEligibility.useQuery({ cardId }).data);
}

export async function testBankQuery(accountId: string) {
  return testQuery(async () => trpc.bank.getBonusProgress.useQuery({ accountId }).data);
} 
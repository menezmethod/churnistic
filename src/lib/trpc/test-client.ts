import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { TRPCError } from '@trpc/server';

import type { AppRouter } from '@/server/routers/_app';

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/api/trpc',
    }),
  ],
});

// Test helper functions
export async function testQuery<T>(queryFn: () => Promise<T>, expectedData?: T): Promise<void> {
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
export async function testUserQuery(): Promise<void> {
  return testQuery(async () => {
    return await trpc.user.me.query();
  });
}

export async function testCardQuery(cardId: string): Promise<void> {
  return testQuery(async () => trpc.card.checkEligibility.query({ cardId }));
}

export async function testBankQuery(accountId: string): Promise<void> {
  return testQuery(async () => trpc.bank.getBonusProgress.query({ accountId }));
}

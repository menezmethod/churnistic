import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';

import { type AppRouter } from '@/server/routers/_app';

const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/api/trpc',
    }),
  ],
});

export function testQuery<T>(fn: () => Promise<T>) {
  return fn();
}

export function testMutation<T>(fn: () => Promise<T>) {
  return fn();
}

export { trpc };

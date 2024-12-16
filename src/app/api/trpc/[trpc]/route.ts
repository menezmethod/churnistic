import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/routers/_app';
import { createContext } from '@/server/trpc';
import { NextRequest } from 'next/server';
import type { CreateNextContextOptions } from '@trpc/server/adapters/next';

// Create a handler for Next.js App Router
const handler = async (req: NextRequest) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    router: appRouter,
    req,
    createContext: async () => {
      return createContext({
        req: req as any,
        res: { json: () => {}, status: () => ({ end: () => {} })} as any,
      } as CreateNextContextOptions);
    },
  });
};

export { handler as GET, handler as POST };
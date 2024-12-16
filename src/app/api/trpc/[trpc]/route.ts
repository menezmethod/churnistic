import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/routers/_app';
import { createContext } from '@/server/trpc';
import { NextRequest } from 'next/server';

// Create a handler for Next.js App Router
const handler = async (req: NextRequest): Promise<Response> => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    router: appRouter,
    req,
    createContext: async () => createContext({ req }),
  });
};

export { handler as GET, handler as POST };
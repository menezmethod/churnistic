import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { type NextRequest } from 'next/server';

import { createContext } from '@/server/context';
import { appRouter } from '@/server/routers/_app';

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(`tRPC error:`, {
              type: error.code,
              path,
              error,
            });
          }
        : undefined,
  });

export { handler as GET, handler as POST };

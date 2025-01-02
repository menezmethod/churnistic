import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { type NextRequest } from 'next/server';
import { type TRPCError } from '@trpc/server';

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
        ? ({ path, error }: { path: string | undefined; error: TRPCError }) => {
            console.error('tRPC error:', {
              code: error.code,
              path: path || 'unknown',
              message: error.message,
              cause: error.cause ? (error.cause as Error).message : undefined,
            });
          }
        : undefined,
  });

export { handler as GET, handler as POST };

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

import { createTRPCContext } from '@/app/api/context';
import { appRouter } from '@/app/api/routers/_app';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });

export { handler as GET, handler as POST };

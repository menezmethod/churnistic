import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { NextRequest } from 'next/server';

import { createContext } from '@/server/context';
import { appRouter } from '@/server/routers/_app';

export async function GET(req: NextRequest): Promise<Response> {
  return handler(req);
}

export async function POST(req: NextRequest): Promise<Response> {
  return handler(req);
}

async function handler(req: NextRequest): Promise<Response> {
  try {
    const response = await fetchRequestHandler({
      endpoint: '/api/trpc',
      req,
      router: appRouter,
      createContext: () => createContext(req),
      onError: ({ error, type, path }) => {
        // Log error in non-production environments
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.error('tRPC error:', { type, path, error });
        }
      },
    });
    return response;
  } catch (err) {
    // Log error in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('Error in tRPC handler:', err);
    }
    return new Response('Internal server error', { status: 500 });
  }
}

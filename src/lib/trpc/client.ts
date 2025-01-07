import { createTRPCNext } from '@trpc/next';

import { type AppRouter } from '@/api/routers/_app';

export const trpc = createTRPCNext<AppRouter>();

export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '';
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function getUrl(): string {
  return `${getBaseUrl()}/api/trpc`;
}

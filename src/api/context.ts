import { type inferAsyncReturnType } from '@trpc/server';
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { getAdminDb } from '@/lib/firebase/admin';
import { type Session } from '@/types/session';

export async function createTRPCContext(opts: FetchCreateContextFnOptions) {
  const session = null; // TODO: Get session from cookie/token

  return {
    session,
    db: getAdminDb(),
  };
}

export type Context = inferAsyncReturnType<typeof createTRPCContext>;

// Export reusable router types
export interface ContextWithSession extends Context {
  session: Session;
}

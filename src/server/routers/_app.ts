import { router } from '../trpc';
import { userRouter } from './user';
import { cardRouter } from './card';
import { bankRouter } from './bank';

export const appRouter = router({
  user: userRouter,
  card: cardRouter,
  bank: bankRouter,
});

export type AppRouter = typeof appRouter; 
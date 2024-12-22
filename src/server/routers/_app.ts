import { router } from '../trpc';
import { bankRouter } from './bank';
import { cardRouter } from './card';
import { userRouter } from './user';

export const appRouter = router({
  user: userRouter,
  card: cardRouter,
  bank: bankRouter,
});

export type AppRouter = typeof appRouter;

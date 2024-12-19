import { bankRouter } from './bank';
import { cardRouter } from './card';
import { companyRouter } from './company';
import { customerRouter } from './customer';
import { userRouter } from './user';
import { router } from '../trpc';

export const appRouter = router({
  user: userRouter,
  card: cardRouter,
  bank: bankRouter,
  company: companyRouter,
  customer: customerRouter,
});

export type AppRouter = typeof appRouter;

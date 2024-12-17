import { router } from '../trpc';
import { userRouter } from './user';
import { cardRouter } from './card';
import { bankRouter } from './bank';
import { companyRouter } from './company';
import { customerRouter } from './customer';

export const appRouter = router({
  user: userRouter,
  card: cardRouter,
  bank: bankRouter,
  company: companyRouter,
  customer: customerRouter,
});

export type AppRouter = typeof appRouter;

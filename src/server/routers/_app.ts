import { router } from '../trpc';

import { bankRouter } from './bank';
import { cardRouter } from './card';
import { companyRouter } from './company';
import { customerRouter } from './customer';
import { userRouter } from './user';

export const appRouter = router({
  user: userRouter,
  card: cardRouter,
  bank: bankRouter,
  company: companyRouter,
  customer: customerRouter,
});

export type AppRouter = typeof appRouter;

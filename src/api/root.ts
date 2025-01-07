import type { UserRouter } from './router-types';
import { userRouter } from './routers/user';
import { router } from './trpc';

export const appRouter = router({
  user: userRouter,
});

export type AppRouter = {
  user: UserRouter;
};

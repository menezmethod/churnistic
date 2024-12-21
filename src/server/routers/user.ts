import { TRPCError } from '@trpc/server';
import { doc, updateDoc } from 'firebase/firestore';
import { z } from 'zod';

import { db } from '@/lib/firebase/config';

import { router, protectedProcedure } from '../trpc';

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to access this resource',
      });
    }

    const user = await ctx.prisma.user.findUnique({
      where: { firebaseUid: ctx.session.uid },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    // If customDisplayName exists, use it as displayName
    if (user.customDisplayName) {
      user.displayName = user.customDisplayName;
    }

    return user;
  }),

  update: protectedProcedure
    .input(
      z.object({
        displayName: z.string().optional(),
        customDisplayName: z.string().optional(),
        email: z.string().email().optional(),
        photoURL: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to access this resource',
        });
      }

      // Update MongoDB
      const user = await ctx.prisma.user.update({
        where: { firebaseUid: ctx.session.uid },
        data: {
          ...input,
          // If customDisplayName is provided, use it as displayName too
          displayName: input.customDisplayName || input.displayName,
        },
      });

      // Update Firestore
      if (input.customDisplayName || input.displayName) {
        const docRef = doc(db, 'users', ctx.session.uid);
        await updateDoc(docRef, {
          displayName: input.customDisplayName || input.displayName,
          customDisplayName: input.customDisplayName,
          updatedAt: new Date().toISOString(),
        });
      }

      return user;
    }),

  delete: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to access this resource',
      });
    }

    await ctx.prisma.user.delete({
      where: { firebaseUid: ctx.session.uid },
    });

    return { success: true };
  }),
});

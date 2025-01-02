import { TRPCError } from '@trpc/server';
import type { Query } from 'firebase-admin/firestore';
import { z } from 'zod';

import { UserRole } from '@/lib/auth/types';
import { db } from '@/lib/firebase/admin';

import { router, protectedProcedure, adminProcedure } from '../trpc';

const USERS_COLLECTION = 'users';

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      });
    }

    const userDoc = await db.collection(USERS_COLLECTION).doc(ctx.session.uid).get();

    if (!userDoc.exists) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return { id: userDoc.id, ...userDoc.data() };
  }),

  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const userDoc = await db.collection(USERS_COLLECTION).doc(input.id).get();

      if (!userDoc.exists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return { id: userDoc.id, ...userDoc.data() };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        displayName: z.string().optional(),
        email: z.string().email().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.session) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        });
      }

      // Check if user exists
      const userRef = db.collection(USERS_COLLECTION).doc(input.id);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Check if user is authorized to update
      if (ctx.session.uid !== input.id && ctx.session.role !== UserRole.ADMIN) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authorized',
        });
      }

      const updateData = {
        ...(input.displayName && { displayName: input.displayName }),
        ...(input.email && { email: input.email }),
        updatedAt: new Date(),
      };

      await userRef.update(updateData);
      
      const updatedDoc = await userRef.get();
      return { id: updatedDoc.id, ...updatedDoc.data() };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const userRef = db.collection(USERS_COLLECTION).doc(input.id);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      await userRef.delete();
      return { id: userDoc.id, ...userDoc.data() };
    }),

  list: adminProcedure
    .input(
      z
        .object({
          limit: z.number().optional(),
          offset: z.number().optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      let query: Query = db.collection(USERS_COLLECTION);

      if (input?.search) {
        // Note: Firestore doesn't support case-insensitive search
        // We'll need to implement a more sophisticated search solution later
        query = query.where('displayName', '>=', input.search)
                    .where('displayName', '<=', input.search + '\uf8ff');
      }

      if (input?.limit) {
        query = query.limit(input.limit);
      }

      if (input?.offset) {
        query = query.orderBy('createdAt').offset(input.offset);
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }),
});

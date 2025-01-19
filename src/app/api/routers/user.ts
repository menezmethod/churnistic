import { TRPCError } from '@trpc/server';
import type { Query } from 'firebase-admin/firestore';
import { Timestamp } from 'firebase-admin/firestore';

import { userInputs } from '@/app/api/router-types';
import { getAdminDb } from '@/lib/firebase/admin';
import { UserRole } from '@/types/roles';
import { type Session } from '@/types/session';

import { adminProcedure, protectedProcedure, router } from '../trpc';

const USERS_COLLECTION = 'users';

interface UserDocument {
  email: string;
  displayName: string | null;
  role: UserRole;
  isSuperAdmin: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface UserResponse {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

function formatUserData(id: string, data: UserDocument): UserResponse {
  return {
    id,
    email: data.email,
    displayName: data.displayName,
    role: data.role,
    isSuperAdmin: data.isSuperAdmin,
    createdAt: data.createdAt.toDate().toISOString(),
    updatedAt: data.updatedAt.toDate().toISOString(),
  };
}

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const session = ctx.session as Session;
    const db = getAdminDb();
    const userRef = db.collection(USERS_COLLECTION).doc(session.uid);
    const userDoc = await userRef.get();

    // In emulator mode, create the user if it doesn't exist
    if (!userDoc.exists && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
      console.log('Creating user document in emulator mode:', session);
      const now = Timestamp.now();
      const userData: UserDocument = {
        email: session.email ?? '',
        displayName: session.name ?? null,
        role: session.role,
        isSuperAdmin: session.isSuperAdmin ?? false,
        createdAt: now,
        updatedAt: now,
      };

      await userRef.set(userData);
      return formatUserData(session.uid, userData);
    }

    if (!userDoc.exists) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return formatUserData(userDoc.id, userDoc.data() as UserDocument);
  }),

  getById: adminProcedure.input(userInputs.getById).query(async ({ input }) => {
    const db = getAdminDb();
    const userDoc = await db.collection(USERS_COLLECTION).doc(input.id).get();

    if (!userDoc.exists) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return formatUserData(userDoc.id, userDoc.data() as UserDocument);
  }),

  update: protectedProcedure.input(userInputs.update).mutation(async ({ ctx, input }) => {
    if (!ctx.session) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      });
    }

    // Check if user exists
    const db = getAdminDb();
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
      updatedAt: Timestamp.now(),
    };

    await userRef.update(updateData);

    const updatedDoc = await userRef.get();
    return formatUserData(updatedDoc.id, updatedDoc.data() as UserDocument);
  }),

  delete: adminProcedure.input(userInputs.delete).mutation(async ({ input }) => {
    const db = getAdminDb();
    const userRef = db.collection(USERS_COLLECTION).doc(input.id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    const userData = formatUserData(userDoc.id, userDoc.data() as UserDocument);
    await userRef.delete();
    return userData;
  }),

  list: adminProcedure.input(userInputs.list).query(async ({ input }) => {
    const db = getAdminDb();
    let query: Query = db.collection(USERS_COLLECTION);

    if (input?.search) {
      // Note: Firestore doesn't support case-insensitive search
      // We'll need to implement a more sophisticated search solution later
      query = query
        .where('displayName', '>=', input.search)
        .where('displayName', '<=', input.search + '\uf8ff');
    }

    if (input?.limit) {
      query = query.limit(input.limit);
    }

    if (input?.offset) {
      query = query.orderBy('createdAt').offset(input.offset);
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => formatUserData(doc.id, doc.data() as UserDocument));
  }),
});

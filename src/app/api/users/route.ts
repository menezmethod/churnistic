import { type Query, type DocumentData } from 'firebase-admin/firestore';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { UserRole } from '@/lib/auth/types';
import { db } from '@/lib/firebase/admin';

// Validation schemas
const userSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
  role: z.nativeEnum(UserRole),
});

const updateSchema = z.object({
  userIds: z.array(z.string()),
  update: z.object({
    role: z.nativeEnum(UserRole).optional(),
    status: z.string().optional(),
    displayName: z.string().optional(),
  }),
});

interface DatabaseUser {
  id: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  status?: string;
  creditScore?: number;
  monthlyIncome?: number;
  isSuperAdmin?: boolean;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortDirection = (searchParams.get('sortDirection') || 'desc') as 'asc' | 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    let query: Query<DocumentData> = db.collection('users');

    if (role) {
      query = query.where('role', '==', role);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    if (search) {
      query = query
        .where('displayName', '>=', search)
        .where('displayName', '<=', search + '\uf8ff');
    }

    query = query.orderBy(sortField, sortDirection);

    const startAt = (page - 1) * pageSize;
    query = query.limit(pageSize).offset(startAt);

    const [snapshot, totalCount] = await Promise.all([
      query.get(),
      db.collection('users').count().get(),
    ]);

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as DatabaseUser[];

    return NextResponse.json({
      data: {
        users,
        totalCount: totalCount.data().count,
        page,
        pageSize,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      {
        error: {
          message: 'Failed to fetch users',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = userSchema.parse(body);

    const userData: DatabaseUser = {
      id: crypto.randomUUID(),
      ...validatedData,
      photoURL: null,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('users').doc(userData.id).set(userData);

    return NextResponse.json({ data: userData });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            message: 'Invalid request data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('Error creating user:', error);
    return NextResponse.json(
      {
        error: {
          message: 'Failed to create user',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userIds, update } = updateSchema.parse(body);

    const batch = db.batch();
    for (const userId of userIds) {
      const userRef = db.collection('users').doc(userId);
      batch.update(userRef, {
        ...update,
        updatedAt: new Date().toISOString(),
      });
    }
    await batch.commit();

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            message: 'Invalid request data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    console.error('Error updating users:', error);
    return NextResponse.json(
      {
        error: {
          message: 'Failed to update users',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userIds } = await request.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        {
          error: {
            message: 'Invalid request data',
            details: 'userIds must be a non-empty array',
          },
        },
        { status: 400 }
      );
    }

    const batch = db.batch();
    for (const userId of userIds) {
      const userRef = db.collection('users').doc(userId);
      batch.delete(userRef);
    }
    await batch.commit();

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error('Error deleting users:', error);
    return NextResponse.json(
      {
        error: {
          message: 'Failed to delete users',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

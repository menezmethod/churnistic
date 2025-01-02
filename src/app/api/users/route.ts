import { type Query, type DocumentData } from 'firebase-admin/firestore';
import { type NextRequest, NextResponse } from 'next/server';

import { UserRole } from '@/lib/auth/types';
import { db } from '@/lib/firebase/admin';

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

  const snapshot = await query.get();
  const users = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as DatabaseUser[];

  const totalCount = await db.collection('users').count().get();

  return NextResponse.json({
    users,
    totalCount: totalCount.data().count,
    page,
    pageSize,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, displayName, role } = body;

  const userData: DatabaseUser = {
    id: crypto.randomUUID(),
    email,
    displayName,
    role,
    photoURL: null,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.collection('users').doc(userData.id).set(userData);

  return NextResponse.json(userData);
}

export async function PATCH(request: NextRequest) {
  try {
    const { userIds, update } = await request.json();

    const batch = db.batch();
    for (const userId of userIds) {
      const userRef = db.collection('users').doc(userId);
      batch.update(userRef, {
        ...update,
        updatedAt: new Date().toISOString(),
      });
    }
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating users:', error);
    return NextResponse.json(
      {
        error: 'Failed to update users',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userIds } = await request.json();

    const batch = db.batch();
    for (const userId of userIds) {
      const userRef = db.collection('users').doc(userId);
      batch.delete(userRef);
    }
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting users:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete users',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

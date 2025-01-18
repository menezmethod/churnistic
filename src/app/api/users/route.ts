import { Timestamp } from 'firebase-admin/firestore';
import { type NextRequest } from 'next/server';

import { UserRole } from '@/lib/auth/types';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const db = getAdminDb();
    const usersRef = db.collection('users');
    let query: FirebaseFirestore.Query = usersRef;

    if (search) {
      query = query
        .where('displayName', '>=', search)
        .where('displayName', '<=', search + '\uf8ff');
    }

    if (limit) {
      query = query.limit(parseInt(limit, 10));
    }

    if (offset) {
      query = query.offset(parseInt(offset, 10));
    }

    const [snapshot, countSnapshot] = await Promise.all([
      query.get(),
      usersRef.count().get(),
    ]);

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return new Response(
      JSON.stringify({
        users,
        total: countSnapshot.data().count,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching users:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    const db = getAdminDb();

    // Add timestamps
    const now = Timestamp.now();
    const userDataWithTimestamps = {
      ...userData,
      role: userData.role || UserRole.USER,
      isSuperAdmin: false,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('users').doc(userData.id).set(userDataWithTimestamps);

    return new Response(JSON.stringify(userDataWithTimestamps), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { ids, updates } = await request.json();
    const db = getAdminDb();
    const batch = db.batch();

    ids.forEach((userId: string) => {
      const userRef = db.collection('users').doc(userId);
      batch.update(userRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    });

    await batch.commit();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating users:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json();
    const db = getAdminDb();
    const batch = db.batch();

    ids.forEach((userId: string) => {
      const userRef = db.collection('users').doc(userId);
      batch.delete(userRef);
    });

    await batch.commit();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting users:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

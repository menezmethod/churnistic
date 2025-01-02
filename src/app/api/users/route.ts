import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { UserRole } from '@/lib/auth/types';
import { db } from '@/lib/firebase/admin';
import type { DatabaseUser } from '@/types/user';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/users - Start');

    // Log request headers for debugging
    const headers = Object.fromEntries(request.headers);
    console.log('Request headers:', headers);

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortDirection = searchParams.get('sortDirection') || 'desc';
    const role = searchParams.get('role') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    console.log('Query params:', {
      page,
      limit,
      sortField,
      sortDirection,
      role,
      status,
      search,
    });

    try {
      // Build query
      let query = db.collection('users');

      // Apply filters
      if (role) {
        query = query.where('role', '==', role);
      }
      if (status) {
        query = query.where('status', '==', status);
      }

      // Apply sorting
      query = query.orderBy(sortField, sortDirection.toLowerCase() as 'desc' | 'asc');

      // Get total count
      const snapshot = await query.get();
      const total = snapshot.size;
      console.log('Total users matching query:', total);

      // Apply pagination
      const startAt = (page - 1) * limit;
      query = query.limit(limit).offset(startAt);

      // Execute query
      const querySnapshot = await query.get();
      const users = querySnapshot.docs.map((doc) => {
        const data = doc.data() as DatabaseUser;
        return {
          id: doc.id,
          email: data.email,
          displayName: data.displayName,
          photoURL: data.photoURL,
          role: data.role,
          status: data.status,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      });

      // If search is provided, filter results in memory
      // Note: Firestore doesn't support case-insensitive search
      const filteredUsers = search
        ? users.filter(
            (user) =>
              user.displayName?.toLowerCase().includes(search.toLowerCase()) ||
              user.email.toLowerCase().includes(search.toLowerCase())
          )
        : users;

      const response = {
        users: filteredUsers,
        total: search ? filteredUsers.length : total,
        hasMore: total > page * limit,
      };

      console.log('Sending response:', JSON.stringify(response, null, 2));
      return NextResponse.json(response);
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return NextResponse.json(
        {
          error: 'Database query error',
          details: dbError instanceof Error ? dbError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in GET /api/users:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firebaseUid, email, displayName } = body;

    // Validate required fields
    if (!firebaseUid || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create user in Firestore
    const userData: DatabaseUser = {
      id: firebaseUid,
      firebaseUid,
      email,
      displayName: displayName || null,
      customDisplayName: null,
      photoURL: null,
      role: UserRole.USER,
      status: 'active',
      creditScore: null,
      monthlyIncome: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      businessVerified: false,
    };

    await db.collection('users').doc(firebaseUid).set(userData);

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userIds, update } = await request.json();

    // Update multiple users
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

    // Delete multiple users
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

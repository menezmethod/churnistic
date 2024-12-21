import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { UserRole } from '@/lib/auth/types';
import { prisma } from '@/lib/prisma';

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

    // Build where clause
    const where: Prisma.UserWhereInput = {
      ...(role && { role: role as UserRole }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { displayName: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
          { email: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
        ],
      }),
    };

    console.log('Where clause:', where);

    try {
      // First, get all users to verify the query works
      console.log('Fetching all users from database...');
      const allUsers = await prisma.user.findMany();
      console.log('All users in database:', allUsers.length);
      console.log('All users:', JSON.stringify(allUsers, null, 2));

      // Get total count
      console.log('Getting total count with where clause:', where);
      const total = await prisma.user.count({ where });
      console.log('Total users matching query:', total);

      // Log query for debugging
      const query = {
        where,
        orderBy: { [sortField]: sortDirection.toLowerCase() },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          displayName: true,
          photoURL: true,
          role: true,
          status: true,
          businessVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      } satisfies Prisma.UserFindManyArgs;
      console.log('Prisma query:', JSON.stringify(query, null, 2));

      // Try a simpler query first
      console.log('Trying simpler query without pagination...');
      const allUsersWithWhere = await prisma.user.findMany({ where });
      console.log('All users with where clause:', allUsersWithWhere.length);
      console.log('Users with where:', JSON.stringify(allUsersWithWhere, null, 2));

      // Now try with just sorting
      console.log('Trying query with just sorting...');
      const allUsersWithSort = await prisma.user.findMany({
        where,
        orderBy: { [sortField]: sortDirection.toLowerCase() },
      });
      console.log('All users with sort:', allUsersWithSort.length);
      console.log('Users with sort:', JSON.stringify(allUsersWithSort, null, 2));

      // Get users with pagination
      console.log('Fetching users with pagination...');
      const users = await prisma.user.findMany(query);
      console.log('Found users:', users.length);
      console.log('Users with pagination:', JSON.stringify(users, null, 2));

      const response = {
        users,
        total,
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

    // Create user in MongoDB
    const userData: Prisma.UserCreateInput = {
      firebaseUid,
      email,
      displayName: displayName || null,
      role: UserRole.USER,
      status: 'active',
    };

    const user = await prisma.user.create({
      data: userData,
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userIds, update } = await request.json();

    // Update multiple users
    await prisma.user.updateMany({
      where: {
        id: {
          in: userIds,
        },
      },
      data: update,
    });

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
    await prisma.user.deleteMany({
      where: {
        id: {
          in: userIds,
        },
      },
    });

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

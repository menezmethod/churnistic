import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { AppUser } from '@/lib/auth/types';

export async function GET(request: NextRequest) {
  const user = request.cookies.get('x-auth-user')?.value;

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const parsedUser: AppUser = JSON.parse(user);
    return NextResponse.json({
      uid: parsedUser.uid,
      email: parsedUser.email,
      role: parsedUser.role,
      permissions: parsedUser.permissions,
      emailVerified: parsedUser.emailVerified,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid session data' }, { status: 401 });
  }
}

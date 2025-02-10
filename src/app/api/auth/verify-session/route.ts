import { NextResponse } from 'next/server';

import { verifySessionCookie } from '@/lib/auth/authUtils';

export async function POST(request: Request) {
  try {
    const { sessionCookie } = await request.json();

    if (!sessionCookie) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    await verifySessionCookie(sessionCookie);
    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json({ valid: false }, { status: 401 });
  }
}

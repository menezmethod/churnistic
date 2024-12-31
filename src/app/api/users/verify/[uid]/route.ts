import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ uid: string }> }
) {
  const params = await props.params;
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: params.uid },
      select: { id: true }, // Only select ID for efficiency
    });

    if (!user) {
      return NextResponse.json({ exists: false }, { status: 404 });
    }

    return NextResponse.json({ exists: true });
  } catch (error) {
    console.error('Error verifying user:', error);
    return NextResponse.json({ error: 'Failed to verify user' }, { status: 500 });
  }
}

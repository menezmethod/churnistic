import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { verifySession } from '@/lib/auth/session';
import { UserRole } from '@/lib/auth/types';
import { getAdminDb } from '@/lib/firebase/admin';

const querySchema = z.object({
  type: z.enum(['credit_card', 'bank', 'brokerage']).optional(),
});

async function verifyAdminAccess(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
    return true;
  }

  const sessionCookie = request.cookies.get('session')?.value;
  if (!sessionCookie) {
    return false;
  }

  const session = await verifySession(sessionCookie);
  return session?.role?.toLowerCase() === UserRole.ADMIN.toLowerCase() || session?.isSuperAdmin;
}

export async function GET(request: NextRequest) {
  try {
    const hasAccess = await verifyAdminAccess(request);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const { type } = querySchema.parse({
      type: searchParams.get('type') || undefined,
    });

    const db = getAdminDb();
    const collection = db.collection('bankrewards');
    
    const snapshot = type 
      ? await collection.where('type', '==', type).get()
      : await collection.get();

    const offers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      total: offers.length,
      offers
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    console.error('Error fetching BankRewards offers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offers' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

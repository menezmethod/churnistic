import { NextResponse } from 'next/server';

import { getAdminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const db = getAdminDb(); // Use centralized admin instance
    await db.collection('health').doc('check').get();
    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    return NextResponse.json({ status: 'error', details: error }, { status: 500 });
  }
}

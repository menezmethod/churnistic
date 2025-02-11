import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { Permission } from '@/lib/auth/types';

import { authOptions } from '@/lib/auth/auth-options';
import { hasPermission } from '@/lib/auth/utils';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      !hasPermission(session.user, Permission.FEATURE_OPPORTUNITIES)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { field, value } = await req.json();
    if (!field || value === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getFirestore();
    const docRef = doc(db, 'opportunities', params.id);

    // Create the update object with nested path support
    const fieldPath = field.split('.');
    const updateData: any = {};
    let current = updateData;
    for (let i = 0; i < fieldPath.length - 1; i++) {
      current[fieldPath[i]] = {};
      current = current[fieldPath[i]];
    }
    current[fieldPath[fieldPath.length - 1]] = value;

    // Add metadata
    updateData.metadata = {
      updated_at: new Date().toISOString(),
      updated_by: session.user.email,
    };

    await updateDoc(docRef, updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating field:', error);
    return NextResponse.json({ error: 'Failed to update field' }, { status: 500 });
  }
}

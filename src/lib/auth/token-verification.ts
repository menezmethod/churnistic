import type { DecodedIdToken } from 'firebase-admin/auth';
import { NextRequest } from 'next/server';

import { auth } from '@/lib/firebase/admin';

export async function verifyAuthToken(req: NextRequest): Promise<DecodedIdToken | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return null;
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error: unknown) {
    console.error(
      'Error verifying auth token:',
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

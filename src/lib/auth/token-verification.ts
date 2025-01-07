import { type DecodedIdToken } from 'firebase-admin/auth';

import { getAdminAuth } from '@/lib/firebase/admin';

export async function verifyToken(token: string): Promise<DecodedIdToken> {
  try {
    const auth = getAdminAuth();
    return await auth.verifyIdToken(token);
  } catch (error) {
    console.error('Error verifying token:', error);
    throw error;
  }
}

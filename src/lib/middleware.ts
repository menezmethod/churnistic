import { NextRequest } from 'next/server';

import { auth } from '@/lib/firebase/admin';

export async function initializeMiddleware(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return null;
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}

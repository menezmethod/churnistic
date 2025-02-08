import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';

// Initialize Firebase Admin with proper error handling
if (getApps().length === 0) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccount) {
      console.error('Firebase service account key is missing');
      throw new Error('Missing Firebase service account key');
    }

    initializeApp({
      credential: cert(JSON.parse(serviceAccount)),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      if (error.stack) console.error('Stack:', error.stack);
    }
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 minutes

export async function GET() {
  console.log('Public stats endpoint called');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      // Check if Firebase is properly initialized
      if (getApps().length === 0) {
        console.warn('Firebase not initialized, returning default values');
        return NextResponse.json(
          {
            activeCount: 0,
            totalPotentialValue: 0,
            averageValue: 0,
            lastUpdated: new Date().toISOString(),
          },
          {
            status: 200,
            headers: {
              'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
            },
          }
        );
      }

      console.log('Firebase initialized, fetching stats');
      const db = getFirestore();
      const opportunitiesSnapshot = await db
        .collection('opportunities')
        .where('status', '==', 'approved')
        .get();

      // Initialize counters
      let activeCount = 0;
      let totalValue = 0;

      // Process opportunities collection
      opportunitiesSnapshot.forEach((doc) => {
        const data = doc.data();
        const value = parseFloat(data.value) || 0;
        totalValue += value;
        activeCount++;
      });

      console.log(`Found ${activeCount} active opportunities`);
      const averageValue = activeCount > 0 ? Math.round(totalValue / activeCount) : 0;

      const result = {
        activeCount,
        totalPotentialValue: totalValue,
        averageValue,
        lastUpdated: new Date().toISOString(),
      };

      return NextResponse.json(result, {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('Public stats endpoint error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      if (error.stack) console.error('Stack:', error.stack);
    }

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Stats request timed out' }, { status: 504 });
    }

    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}

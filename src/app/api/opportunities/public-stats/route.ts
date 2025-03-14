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
  const requestStart = Date.now();
  console.log('[PUBLIC-STATS] API endpoint called at', new Date().toISOString());
  console.log('[PUBLIC-STATS] Firebase apps initialized:', getApps().length);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[PUBLIC-STATS] Request timed out after 5000ms');
      controller.abort();
    }, 5000);

    try {
      // Check if Firebase is properly initialized
      if (getApps().length === 0) {
        console.warn('[PUBLIC-STATS] Firebase not initialized, returning default values');
        return NextResponse.json(
          {
            activeCount: 0,
            totalPotentialValue: 0,
            averageValue: 0,
            lastUpdated: new Date().toISOString(),
            debug: {
              firebaseInitialized: false,
              requestDuration: Date.now() - requestStart,
              timestamp: Date.now(),
            }
          },
          {
            status: 200,
            headers: {
              'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
              'X-Debug-Firebase-Initialized': 'false',
            },
          }
        );
      }

      console.log('[PUBLIC-STATS] Firebase initialized, fetching stats');
      const dbStart = Date.now();
      const db = getFirestore();
      const opportunitiesSnapshot = await db
        .collection('opportunities')
        .where('status', '==', 'approved')
        .get();
      const dbDuration = Date.now() - dbStart;
      console.log(`[PUBLIC-STATS] Firestore query completed in ${dbDuration}ms`);

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

      console.log(`[PUBLIC-STATS] Found ${activeCount} active opportunities with total value ${totalValue}`);
      const averageValue = activeCount > 0 ? Math.round(totalValue / activeCount) : 0;

      const totalDuration = Date.now() - requestStart;
      const result = {
        activeCount,
        totalPotentialValue: totalValue,
        averageValue,
        lastUpdated: new Date().toISOString(),
        debug: {
          firebaseInitialized: true,
          requestDuration: totalDuration,
          dbQueryDuration: dbDuration,
          timestamp: Date.now(),
        }
      };

      console.log('[PUBLIC-STATS] Returning result:', JSON.stringify(result));
      console.log(`[PUBLIC-STATS] Total request duration: ${totalDuration}ms`);

      return NextResponse.json(result, {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
          'X-Debug-Firebase-Initialized': 'true',
          'X-Debug-Request-Duration': totalDuration.toString(),
        },
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    const errorDuration = Date.now() - requestStart;
    console.error(`[PUBLIC-STATS] Error after ${errorDuration}ms:`, error);
    if (error instanceof Error) {
      console.error('[PUBLIC-STATS] Error details:', error.message);
      if (error.stack) console.error('[PUBLIC-STATS] Stack:', error.stack);
    }

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ 
        error: 'Stats request timed out',
        debug: {
          firebaseInitialized: getApps().length > 0,
          requestDuration: errorDuration,
          timestamp: Date.now(),
        }
      }, { status: 504 });
    }

    return NextResponse.json({ 
      error: 'Failed to fetch statistics',
      debug: {
        firebaseInitialized: getApps().length > 0,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        requestDuration: errorDuration,
        timestamp: Date.now(),
      }
    }, { status: 500 });
  }
}

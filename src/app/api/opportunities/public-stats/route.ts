import { NextResponse } from 'next/server';

import { getAdminDb } from '@/lib/firebase/admin';

// Create a more robust initialization function
async function ensureFirebaseInitialized(): Promise<boolean> {
  try {
    console.log('[PUBLIC-STATS] Attempting to get Firestore instance');
    const db = getAdminDb();

    if (!db) {
      console.error('[PUBLIC-STATS] Failed to get Firestore instance');
      return false;
    }

    // Verify the connection works by making a small test query
    console.log('[PUBLIC-STATS] Firestore instance obtained, attempting test query');
    const testQuery = await db.collection('opportunities').limit(1).get();
    console.log(
      '[PUBLIC-STATS] Firebase connection verified with test query, found',
      testQuery.size,
      'documents'
    );
    return true;
  } catch (e) {
    console.error('[PUBLIC-STATS] Firebase connection test failed:', e);
    if (e instanceof Error) {
      console.error('[PUBLIC-STATS] Connection test error details:', e.message);
    }
    return false;
  }
}

// Try to initialize Firebase immediately, but don't block
ensureFirebaseInitialized().then((success) => {
  console.log(
    `[PUBLIC-STATS] Initial Firebase initialization ${success ? 'succeeded' : 'failed'}`
  );
});

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 minutes

export async function GET() {
  const requestStart = Date.now();
  console.log('[PUBLIC-STATS] API endpoint called at', new Date().toISOString());

  try {
    // Attempt to ensure Firebase is initialized
    const firebaseInitialized = await ensureFirebaseInitialized();
    console.log('[PUBLIC-STATS] Firebase initialization status:', firebaseInitialized);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[PUBLIC-STATS] Request timed out after 8000ms');
      controller.abort();
    }, 8000); // 8 seconds timeout

    try {
      // Check if Firebase is properly initialized
      if (!firebaseInitialized) {
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
              environment: process.env.NODE_ENV,
            },
          },
          {
            status: 200,
            headers: {
              'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=15', // Reduced cache time for failures
              'X-Debug-Firebase-Initialized': 'false',
            },
          }
        );
      }

      console.log('[PUBLIC-STATS] Firebase initialized, fetching stats');
      const dbStart = Date.now();
      const db = getAdminDb();
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

      console.log(
        `[PUBLIC-STATS] Found ${activeCount} active opportunities with total value ${totalValue}`
      );
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
          environment: process.env.NODE_ENV,
        },
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
      return NextResponse.json(
        {
          error: 'Stats request timed out',
          debug: {
            firebaseInitialized: false,
            requestDuration: errorDuration,
            timestamp: Date.now(),
            environment: process.env.NODE_ENV,
          },
        },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch statistics',
        debug: {
          firebaseInitialized: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          requestDuration: errorDuration,
          timestamp: Date.now(),
          environment: process.env.NODE_ENV,
        },
      },
      { status: 500 }
    );
  }
}

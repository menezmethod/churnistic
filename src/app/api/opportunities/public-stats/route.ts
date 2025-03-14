import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';

// Global variable to track initialization attempts
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

// Create a more robust initialization function
async function ensureFirebaseInitialized(): Promise<boolean> {
  // If Firebase is already initialized, return true
  if (getApps().length > 0) {
    console.log('[PUBLIC-STATS] Firebase already initialized');
    return true;
  }

  // Limit the number of initialization attempts
  if (initializationAttempts >= MAX_INIT_ATTEMPTS) {
    console.error(`[PUBLIC-STATS] Max initialization attempts (${MAX_INIT_ATTEMPTS}) reached`);
    return false;
  }

  initializationAttempts++;
  console.log(`[PUBLIC-STATS] Attempting to initialize Firebase (attempt ${initializationAttempts}/${MAX_INIT_ATTEMPTS})`);

  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccount) {
      console.error('[PUBLIC-STATS] Firebase service account key is missing');
      throw new Error('Missing Firebase service account key');
    }

    // Initialize Firebase with the service account
    initializeApp({
      credential: cert(JSON.parse(serviceAccount)),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });

    // Verify initialization was successful
    if (getApps().length > 0) {
      console.log('[PUBLIC-STATS] Firebase successfully initialized');
      return true;
    } else {
      console.error('[PUBLIC-STATS] Firebase initialization failed - getApps() returned empty array');
      return false;
    }
  } catch (error) {
    console.error('[PUBLIC-STATS] Firebase Admin initialization error:', error);
    if (error instanceof Error) {
      console.error('[PUBLIC-STATS] Error details:', error.message);
      if (error.stack) console.error('[PUBLIC-STATS] Stack:', error.stack);
    }
    return false;
  }
}

// Try to initialize Firebase immediately, but don't block
ensureFirebaseInitialized().then((success) => {
  console.log(`[PUBLIC-STATS] Initial Firebase initialization ${success ? 'succeeded' : 'failed'}`);
});

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 minutes

export async function GET() {
  const requestStart = Date.now();
  console.log('[PUBLIC-STATS] API endpoint called at', new Date().toISOString());
  
  // Attempt to ensure Firebase is initialized
  const firebaseInitialized = await ensureFirebaseInitialized();
  console.log('[PUBLIC-STATS] Firebase initialization status:', firebaseInitialized);
  console.log('[PUBLIC-STATS] Firebase apps initialized:', getApps().length);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[PUBLIC-STATS] Request timed out after 5000ms');
      controller.abort();
    }, 5000);

    try {
      // Check if Firebase is properly initialized
      if (!firebaseInitialized || getApps().length === 0) {
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
              initAttempts: initializationAttempts,
            }
          },
          {
            status: 200,
            headers: {
              'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30', // Reduced cache time for failures
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
          initAttempts: initializationAttempts,
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
          initAttempts: initializationAttempts,
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
        initAttempts: initializationAttempts,
      }
    }, { status: 500 });
  }
}

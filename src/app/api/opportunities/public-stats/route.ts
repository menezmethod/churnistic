import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';

// Global variable to track initialization attempts
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 5; // Increased from 3 to 5
let lastInitAttempt = 0;
const INIT_COOLDOWN = 2000; // 2 seconds cooldown between initialization attempts

// Create a more robust initialization function
async function ensureFirebaseInitialized(): Promise<boolean> {
  // If Firebase is already initialized, return true
  if (getApps().length > 0) {
    console.log('[PUBLIC-STATS] Firebase already initialized, apps count:', getApps().length);
    try {
      // Verify the connection works by making a small test query
      const db = getFirestore();
      const testQuery = await db.collection('opportunities').limit(1).get();
      console.log('[PUBLIC-STATS] Firebase connection verified with test query, found', testQuery.size, 'documents');
      return true;
    } catch (e) {
      console.error('[PUBLIC-STATS] Firebase initialized but connection test failed:', e);
      // Continue with reinitialization
    }
  }

  // Implement cooldown between attempts
  const now = Date.now();
  if (now - lastInitAttempt < INIT_COOLDOWN && initializationAttempts > 0) {
    console.log(`[PUBLIC-STATS] Cooling down between initialization attempts (${now - lastInitAttempt}ms < ${INIT_COOLDOWN}ms)`);
    await new Promise(resolve => setTimeout(resolve, INIT_COOLDOWN - (now - lastInitAttempt)));
  }
  
  lastInitAttempt = Date.now();

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

    // Log service account key length for debugging (don't log the actual key)
    console.log(`[PUBLIC-STATS] Service account key length: ${serviceAccount.length} chars`);
    
    // Try parsing the service account key
    let parsedServiceAccount;
    try {
      parsedServiceAccount = JSON.parse(serviceAccount);
      console.log('[PUBLIC-STATS] Service account key successfully parsed');
    } catch (parseError) {
      console.error('[PUBLIC-STATS] Failed to parse service account key:', parseError);
      throw new Error('Invalid service account key format');
    }

    // Initialize Firebase with the service account
    initializeApp({
      credential: cert(parsedServiceAccount),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    }, `app-${Date.now()}`); // Add unique name to avoid conflicts

    // Verify initialization was successful
    if (getApps().length > 0) {
      console.log('[PUBLIC-STATS] Firebase successfully initialized, apps count:', getApps().length);
      
      // Verify the connection works
      try {
        const db = getFirestore();
        const testQuery = await db.collection('opportunities').limit(1).get();
        console.log('[PUBLIC-STATS] Firebase connection verified with test query, found', testQuery.size, 'documents');
        return true;
      } catch (e) {
        console.error('[PUBLIC-STATS] Firebase initialized but connection test failed:', e);
        return false;
      }
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
  
  try {
    // Attempt to ensure Firebase is initialized
    const firebaseInitialized = await ensureFirebaseInitialized();
    console.log('[PUBLIC-STATS] Firebase initialization status:', firebaseInitialized);
    console.log('[PUBLIC-STATS] Firebase apps initialized:', getApps().length);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[PUBLIC-STATS] Request timed out after 8000ms');
      controller.abort();
    }, 8000); // Increased from 5000 to 8000 ms

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
              environment: process.env.NODE_ENV,
              appsCount: getApps().length,
            }
          },
          {
            status: 200,
            headers: {
              'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=15', // Further reduced cache time for failures
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
          environment: process.env.NODE_ENV,
          appsCount: getApps().length,
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
          environment: process.env.NODE_ENV,
          appsCount: getApps().length,
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
        environment: process.env.NODE_ENV,
        appsCount: getApps().length,
      }
    }, { status: 500 });
  }
}

import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';

// Global variable to track initialization attempts
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 5; // Increased from 3 to 5
let lastInitAttempt = 0;
const INIT_COOLDOWN = 2000; // 2 seconds cooldown between initialization attempts

// Use Firebase Admin's ServiceAccount type instead of our custom interface
// interface ServiceAccount {
//   type: string;
//   project_id: string;
//   private_key_id: string;
//   private_key: string;
//   client_email: string;
//   client_id: string;
//   auth_uri: string;
//   token_uri: string;
//   auth_provider_x509_cert_url: string;
//   client_x509_cert_url: string;
// }

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
    // Check for environment variables
    console.log('[PUBLIC-STATS] Environment:', process.env.NODE_ENV);
    console.log('[PUBLIC-STATS] NEXT_PUBLIC_FIREBASE_DATABASE_URL exists:', !!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL);
    console.log('[PUBLIC-STATS] FIREBASE_SERVICE_ACCOUNT_KEY exists:', !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccount) {
      console.error('[PUBLIC-STATS] Firebase service account key is missing');
      throw new Error('Missing Firebase service account key');
    }

    // Log service account key length and characteristics for debugging
    console.log(`[PUBLIC-STATS] Service account key length: ${serviceAccount.length} chars`);
    console.log(`[PUBLIC-STATS] Service account key starts with: ${serviceAccount.substring(0, 10)}...`);
    console.log(`[PUBLIC-STATS] Service account key ends with: ...${serviceAccount.substring(serviceAccount.length - 10)}`);
    console.log('[PUBLIC-STATS] Contains escaped quotes:', serviceAccount.includes('\\"'));
    console.log('[PUBLIC-STATS] Contains linebreaks:', serviceAccount.includes('\\n'));
    
    // Try parsing the service account key
    let parsedServiceAccount: ServiceAccount;
    try {
      parsedServiceAccount = JSON.parse(serviceAccount);
      console.log('[PUBLIC-STATS] Service account key successfully parsed');
      console.log('[PUBLIC-STATS] Service account project_id:', parsedServiceAccount.projectId);
      console.log('[PUBLIC-STATS] Service account client_email exists:', !!parsedServiceAccount.clientEmail);
      console.log('[PUBLIC-STATS] Service account private_key exists:', !!parsedServiceAccount.privateKey);
      
      // Check for common issues with private_key format
      if (parsedServiceAccount.privateKey) {
        console.log('[PUBLIC-STATS] Private key contains BEGIN PRIVATE KEY:', parsedServiceAccount.privateKey.includes('BEGIN PRIVATE KEY'));
        console.log('[PUBLIC-STATS] Private key contains newlines:', parsedServiceAccount.privateKey.includes('\n'));
      }
    } catch (parseError) {
      console.error('[PUBLIC-STATS] Failed to parse service account key:', parseError);
      if (parseError instanceof Error) {
        console.error('[PUBLIC-STATS] Parse error message:', parseError.message);
        console.error('[PUBLIC-STATS] Parse error position:', parseError.message.match(/position (\d+)/)?.[1]);
      }
      throw new Error('Invalid service account key format');
    }

    // Initialize Firebase with the service account
    console.log('[PUBLIC-STATS] Attempting to create Firebase credential');
    try {
      const credential = cert(parsedServiceAccount);
      console.log('[PUBLIC-STATS] Firebase credential created successfully');
      
      const appName = `app-${Date.now()}`;
      console.log(`[PUBLIC-STATS] Initializing Firebase app with name: ${appName}`);
      
      initializeApp({
        credential: credential,
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      }, appName); // Add unique name to avoid conflicts
      
      console.log('[PUBLIC-STATS] initializeApp call completed');
    } catch (certError) {
      console.error('[PUBLIC-STATS] Error creating Firebase credential:', certError);
      if (certError instanceof Error) {
        console.error('[PUBLIC-STATS] Cert error message:', certError.message);
      }
      throw certError;
    }

    // Verify initialization was successful
    if (getApps().length > 0) {
      console.log('[PUBLIC-STATS] Firebase successfully initialized, apps count:', getApps().length);
      
      // Verify the connection works
      try {
        console.log('[PUBLIC-STATS] Attempting to get Firestore instance');
        const db = getFirestore();
        console.log('[PUBLIC-STATS] Firestore instance obtained, attempting test query');
        
        const testQuery = await db.collection('opportunities').limit(1).get();
        console.log('[PUBLIC-STATS] Firebase connection verified with test query, found', testQuery.size, 'documents');
        return true;
      } catch (e) {
        console.error('[PUBLIC-STATS] Firebase initialized but connection test failed:', e);
        if (e instanceof Error) {
          console.error('[PUBLIC-STATS] Connection test error details:', e.message);
        }
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

    // If all standard initialization attempts fail, try a fallback method
    if (initializationAttempts >= MAX_INIT_ATTEMPTS - 1) {
      console.log('[PUBLIC-STATS] Attempting fallback initialization method');
      try {
        // Try to fix common issues with service account keys in environment variables
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (!serviceAccount) {
          return false;
        }
        
        // Try to handle both double-escaped and single-escaped newlines
        let correctedServiceAccount = serviceAccount;
        
        // Replace escaped newlines with actual newlines if they exist
        if (correctedServiceAccount.includes('\\n')) {
          console.log('[PUBLIC-STATS] Fixing escaped newlines in service account');
          correctedServiceAccount = correctedServiceAccount.replace(/\\n/g, '\n');
        }
        
        // Replace escaped quotes with regular quotes if they exist
        if (correctedServiceAccount.includes('\\"')) {
          console.log('[PUBLIC-STATS] Fixing escaped quotes in service account');
          correctedServiceAccount = correctedServiceAccount.replace(/\\"/g, '"');
        }
        
        // If the service account is surrounded by extra quotes, remove them
        if (correctedServiceAccount.startsWith('"') && correctedServiceAccount.endsWith('"')) {
          console.log('[PUBLIC-STATS] Removing surrounding quotes from service account');
          correctedServiceAccount = correctedServiceAccount.slice(1, -1);
        }
        
        console.log('[PUBLIC-STATS] Parsing corrected service account');
        const parsedServiceAccount: ServiceAccount = JSON.parse(correctedServiceAccount);
        
        // Ensure private_key has proper newlines
        if (parsedServiceAccount.privateKey && !parsedServiceAccount.privateKey.includes('\n')) {
          console.log('[PUBLIC-STATS] Adding newlines to private_key');
          parsedServiceAccount.privateKey = parsedServiceAccount.privateKey.replace(/\\n/g, '\n');
        }
        
        console.log('[PUBLIC-STATS] Initializing with fallback method');
        const appName = `fallback-app-${Date.now()}`;
        initializeApp({
          credential: cert(parsedServiceAccount),
          databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        }, appName);
        
        console.log('[PUBLIC-STATS] Fallback initialization succeeded');
        return getApps().length > 0;
      } catch (fallbackError) {
        console.error('[PUBLIC-STATS] Fallback initialization failed:', fallbackError);
        if (fallbackError instanceof Error) {
          console.error('[PUBLIC-STATS] Fallback error details:', fallbackError.message);
        }
        return false;
      }
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

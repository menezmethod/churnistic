import { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { type NextRequest, NextResponse } from 'next/server';

import { createAuthContext } from '@/lib/auth/authUtils';
import { getAdminDb } from '@/lib/firebase/admin';
import type { FirestoreOpportunity } from '@/types/opportunity';

const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
const isPreviewEnvironment = process.env.VERCEL_ENV === 'preview';

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/opportunities - Starting request');
    console.log('Environment:', {
      useEmulator,
      isPreviewEnvironment,
      vercelEnv: process.env.VERCEL_ENV,
    });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limitParam = searchParams.get('limit');
    const limitNum = limitParam ? Number(limitParam) : undefined;

    console.log('Query params:', { type, limitNum });

    const db = getAdminDb();
    const opportunitiesRef = db.collection(
      'opportunities'
    ) as FirebaseFirestore.CollectionReference;

    // Skip auth check in emulator or preview environment
    if (!useEmulator && !isPreviewEnvironment) {
      const { session } = await createAuthContext(request);
      if (!session?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('Building Firestore query...');
    let queryRef: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> =
      opportunitiesRef;

    if (type) {
      queryRef = queryRef.where('type', '==', type);
    }

    // Only apply limit if explicitly requested
    if (limitNum) {
      queryRef = queryRef.limit(limitNum);
    }

    const snapshot = await queryRef.get();
    console.log('Query snapshot:', {
      size: snapshot.size,
      empty: snapshot.empty,
      docs: snapshot.docs.length,
    });

    if (snapshot.empty) {
      console.log('No opportunities found');
      return NextResponse.json([]);
    }

    const opportunities = snapshot.docs.map((doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      } as FirestoreOpportunity;
    });

    return NextResponse.json(opportunities);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('POST /api/opportunities - Starting request');
    console.log('Environment:', {
      useEmulator,
      isPreviewEnvironment,
      vercelEnv: process.env.VERCEL_ENV,
    });

    // Always get the auth context
    const { session } = await createAuthContext(req);

    // In production, require authentication
    if (!useEmulator && !isPreviewEnvironment && !session?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    if (!req.body) {
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
    }

    let body;
    try {
      body = await req.json();
      console.log('Received data:', JSON.stringify(body, null, 2));
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.name || !body.type || !body.id || !body.metadata?.created_by) {
      console.error('Missing required fields:', {
        name: body.name,
        type: body.type,
        id: body.id,
        created_by: body.metadata?.created_by,
      });
      return NextResponse.json(
        { error: 'Name, type, id, and metadata.created_by are required fields' },
        { status: 400 }
      );
    }

    // In production, ensure the user can only use their own email
    if (
      !useEmulator &&
      !isPreviewEnvironment &&
      session?.email !== body.metadata.created_by
    ) {
      return NextResponse.json(
        { error: 'Cannot create opportunities on behalf of other users' },
        { status: 403 }
      );
    }

    // Create the opportunity object with proper type checking
    const opportunity = {
      id: body.id,
      name: body.name.trim(),
      type: body.type,
      description: body.description || '',
      offer_link: body.offer_link || '',
      value: parseInt(body.value) || 0,
      source_id: body.source_id || body.id,
      source: body.source || {
        name: 'bankrewards.io',
        collected_at: new Date().toISOString(),
        original_id: body.source_id || body.id,
        timing: null,
        availability: null,
        credit: null,
      },
      bonus: {
        title: body.bonus?.title || '',
        description: body.bonus?.description || '',
        requirements: body.bonus?.requirements || {
          title: '',
          description: '',
        },
        additional_info: body.bonus?.additional_info || null,
        tiers: body.bonus?.tiers || null,
      },
      details: {
        monthly_fees: body.details?.monthly_fees || {
          amount: '0',
        },
        account_type: body.details?.account_type || '',
        availability: body.details?.availability || {
          type: 'Nationwide',
          states: [],
        },
        credit_inquiry: body.details?.credit_inquiry || null,
        household_limit: body.details?.household_limit || null,
        early_closure_fee: body.details?.early_closure_fee || null,
        chex_systems: body.details?.chex_systems || null,
        expiration: body.details?.expiration || null,
        options_trading: body.details?.options_trading || null,
        ira_accounts: body.details?.ira_accounts || null,
        under_5_24:
          body.details?.under_5_24 !== undefined ? body.details.under_5_24 : null,
        foreign_transaction_fees: body.details?.foreign_transaction_fees || null,
        annual_fees: body.details?.annual_fees || null,
      },
      logo: body.logo || {
        type: '',
        url: '',
      },
      card_image:
        body.type === 'credit_card'
          ? body.card_image || {
              url: '',
              network: 'Unknown',
              color: 'Unknown',
              badge: null,
            }
          : null,
      metadata: {
        ...(body.metadata || {}),
        created_at: body.metadata?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: body.metadata.created_by,
        updated_by: body.metadata.created_by,
        status: body.metadata?.status || 'active',
        environment: process.env.NODE_ENV || 'development',
      },
      status: body.status || 'approved',
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('Processed opportunity:', JSON.stringify(opportunity, null, 2));

    try {
      const db = getAdminDb();
      // Use the provided ID instead of generating a new one
      await db.collection('opportunities').doc(body.id).set(opportunity);
      console.log('Opportunity created with ID:', body.id);

      return NextResponse.json({
        id: body.id,
        message: 'Opportunity created successfully',
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        {
          error: 'Database error',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating opportunity:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to create opportunity', details: errorMessage },
      { status: 500 }
    );
  }
}

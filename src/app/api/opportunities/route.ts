import { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { type NextRequest, NextResponse } from 'next/server';

import { createAuthContext } from '@/lib/auth/authUtils';
import { getAdminDb } from '@/lib/firebase/admin';
import { FormData, FirestoreOpportunity } from '@/types/opportunity';

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
    const limitNum = Number(searchParams.get('limit')) || 10;

    console.log('Query params:', { type, limitNum });

    const db = getAdminDb();
    const opportunitiesRef = db.collection('opportunities');

    // Skip auth check in emulator or preview environment
    if (!useEmulator && !isPreviewEnvironment) {
      const { session } = await createAuthContext(request);
      if (!session?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('Building Firestore query...');
    let queryRef = opportunitiesRef.limit(limitNum);

    if (type) {
      queryRef = queryRef.where('type', '==', type);
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

    let userEmail = 'preview@example.com';

    // Skip auth check in emulator or preview environment
    if (!useEmulator && !isPreviewEnvironment) {
      const { session } = await createAuthContext(req);
      if (!session?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userEmail = session.email;
    }

    // Parse and validate request body
    if (!req.body) {
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
    }

    let body;
    try {
      body = await req.json();
      console.log('Received data:', body);
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const data = body as FormData;

    // Validate required fields
    if (!data.name || !data.type) {
      return NextResponse.json(
        { error: 'Name and type are required fields' },
        { status: 400 }
      );
    }

    const opportunity = {
      name: data.name.trim(),
      type: data.type,
      description: data.description || '',
      offer_link: data.offer_link || '',
      value: parseInt(data.value) || 0,
      bonus: {
        title: data.bonus?.title || '',
        description: data.bonus?.description || '',
        requirements: {
          title: data.bonus?.requirements?.title || '',
          description: data.bonus?.requirements?.description || '',
          minimum_deposit: data.bonus?.requirements?.minimum_deposit || null,
          trading_requirements: data.bonus?.requirements?.trading_requirements || null,
          holding_period: data.bonus?.requirements?.holding_period || null,
        },
        additional_info: data.bonus?.additional_info || null,
        tiers: data.bonus?.tiers || null,
      },
      details: {
        monthly_fees: {
          amount: data.details?.monthly_fees?.amount || '0',
        },
        account_type: data.details?.account_type || '',
        availability: data.details?.availability || {
          type: 'Nationwide',
          states: [],
        },
        credit_inquiry: data.details?.credit_inquiry || null,
        household_limit: data.details?.household_limit || null,
        early_closure_fee: data.details?.early_closure_fee || null,
        chex_systems: data.details?.chex_systems || null,
        expiration: data.details?.expiration || null,
      },
      logo: {
        type: data.logo?.type || '',
        url: data.logo?.url || '',
      },
      card_image:
        data.type === 'credit_card'
          ? {
              url: data.card_image?.url || '',
              network: data.card_image?.network || 'Unknown',
              color: data.card_image?.color || 'Unknown',
              badge: data.card_image?.badge,
            }
          : null,
      metadata: {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: userEmail,
        status: 'active',
        environment: isPreviewEnvironment ? 'preview' : 'production',
      },
    };

    const db = getAdminDb();
    const docRef = await db.collection('opportunities').add(opportunity);

    console.log('Opportunity created with ID:', docRef.id);

    return NextResponse.json({
      id: docRef.id,
      message: 'Opportunity created successfully',
    });
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

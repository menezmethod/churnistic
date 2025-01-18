import { NextRequest, NextResponse } from 'next/server';

import { createAuthContext } from '@/lib/auth/authUtils';
import { getAdminDb } from '@/lib/firebase/admin';
import { FormData } from '@/types/opportunity';

const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

export async function GET(req: NextRequest) {
  try {
    console.log('GET /api/opportunities - Starting request');

    // Skip auth check in emulator mode
    if (!useEmulator) {
      const { session } = await createAuthContext(req);
      console.log('Auth session:', session);
      if (!session?.email) {
        console.log('No session email found');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log('Query params:', { type, limit });

    const db = getAdminDb();
    console.log('Got Firestore instance');

    let query = db
      .collection('opportunities')
      .orderBy('metadata.created_at', 'desc')
      .limit(limit);

    if (type) {
      query = query.where('type', '==', type);
    }

    console.log('Executing Firestore query...');
    const snapshot = await query.get();
    console.log('Query snapshot:', {
      size: snapshot.size,
      empty: snapshot.empty,
      docs: snapshot.docs.length
    });
    
    if (snapshot.empty) {
      console.log('No opportunities found in Firestore');
      return NextResponse.json([]);
    }

    const opportunities = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        value: data.value || 0,
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
          availability: data.details?.availability || { type: 'Nationwide' },
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
            : undefined,
        metadata: {
          created_at: data.metadata?.created_at || new Date().toISOString(),
          updated_at: data.metadata?.updated_at || new Date().toISOString(),
          created_by: data.metadata?.created_by || 'system',
          status: data.metadata?.status || 'active',
        },
      };
    });

    console.log('Found opportunities:', opportunities.length);
    if (opportunities.length > 0) {
      console.log('First opportunity:', JSON.stringify(opportunities[0], null, 2));
    }

    return NextResponse.json(opportunities);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('POST /api/opportunities - Starting request');

    let userEmail = 'test@example.com';

    // Skip auth check in emulator mode
    if (!useEmulator) {
      const { session } = await createAuthContext(req);
      if (!session?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userEmail = session.email;
    }

    const body = await req.json();
    console.log('Received data:', body);

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const data = body as FormData;

    // Validate required fields
    if (!data.name || !data.type) {
      return NextResponse.json(
        { error: 'Name and type are required fields' },
        { status: 400 }
      );
    }

    // Convert the value to a number for storage
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
      },
    };

    console.log('Prepared opportunity data:', opportunity);

    const db = getAdminDb();
    console.log('Got Firestore instance');

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

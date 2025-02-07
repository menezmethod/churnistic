import { Query } from 'firebase-admin/firestore';
import { type NextRequest, NextResponse } from 'next/server';

import { createAuthContext } from '@/lib/auth/authUtils';
import { getAdminDb } from '@/lib/firebase/admin';
import { getFullCollectionName } from '@/lib/firebase/utils/environment';
import { type Opportunity } from '@/types/opportunity';

export async function GET(request: NextRequest) {
  try {
    console.log('📥 GET /api/opportunities - Starting request');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortDirection = (searchParams.get('sortDirection') as 'asc' | 'desc') || 'desc';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'approved';
    const type = searchParams.get('type');
    const minValue = searchParams.get('minValue')
      ? parseInt(searchParams.get('minValue')!, 10)
      : undefined;
    const maxValue = searchParams.get('maxValue')
      ? parseInt(searchParams.get('maxValue')!, 10)
      : undefined;

    console.log('🔍 Query params:', {
      page,
      pageSize,
      sortBy,
      sortDirection,
      search,
      status,
      type,
      minValue,
      maxValue,
    });

    const db = getAdminDb();
    if (!db) {
      console.error('❌ Failed to initialize Firebase Admin');
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    const collectionRef = db.collection(getFullCollectionName('opportunities'));
    let queryRef: Query = collectionRef;

    // Apply filters
    if (status) {
      const statuses = status.split(',');
      if (statuses.length > 0) {
        queryRef = queryRef.where('status', 'in', statuses);
      }
    }

    if (type) {
      queryRef = queryRef.where('type', '==', type);
    }

    if (minValue !== undefined) {
      queryRef = queryRef.where('value', '>=', minValue);
    }

    if (maxValue !== undefined) {
      queryRef = queryRef.where('value', '<=', maxValue);
    }

    // Apply search filter if provided
    if (search) {
      queryRef = queryRef
        .where('name', '>=', search)
        .where('name', '<=', search + '\uf8ff');
    }

    // Get total count before applying pagination
    const totalCountSnapshot = await queryRef.count().get();
    const total = totalCountSnapshot.data().count;

    // Apply sorting
    queryRef = queryRef.orderBy(sortBy, sortDirection);

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    if (startIndex > 0) {
      queryRef = queryRef.offset(startIndex);
    }
    queryRef = queryRef.limit(pageSize);

    console.log('🚀 Executing Firestore query...');
    const snapshot = await queryRef.get();

    console.log('📊 Query snapshot:', {
      size: snapshot.size,
      empty: snapshot.empty,
      docs: snapshot.docs.length,
      total,
    });

    if (snapshot.empty) {
      console.log('ℹ️ No opportunities found');
      return NextResponse.json({
        items: [],
        total: 0,
        hasMore: false,
      });
    }

    const opportunities = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Opportunity[];

    const hasMore = total > startIndex + opportunities.length;

    console.log('✅ Processed opportunities:', {
      count: opportunities.length,
      total,
      hasMore,
      sample: opportunities[0] && {
        id: opportunities[0].id,
        name: opportunities[0].name,
        type: opportunities[0].type,
      },
    });

    return NextResponse.json({
      items: opportunities,
      total,
      hasMore,
    });
  } catch (error) {
    console.error('❌ Error in GET /api/opportunities:', error);
    return NextResponse.json({ error: 'Failed to fetch opportunities' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('📥 POST /api/opportunities - Starting request');
    const { session } = await createAuthContext(req);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    if (!req.body) {
      return NextResponse.json({ error: 'Request body is required' }, { status: 400 });
    }

    let body;
    try {
      body = await req.json();
      console.log('📦 Received data:', JSON.stringify(body, null, 2));
    } catch (error) {
      console.error('❌ Error parsing request body:', error);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.name || !body.type || !body.id) {
      console.error('❌ Missing required fields:', {
        name: body.name,
        type: body.type,
        id: body.id,
      });
      return NextResponse.json(
        { error: 'Name, type, and id are required fields' },
        { status: 400 }
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
        created_by: body.metadata?.created_by || 'system',
        updated_by: body.metadata?.created_by || 'system',
        status: body.metadata?.status || 'active',
        environment: process.env.NODE_ENV || 'development',
      },
      status: body.status || 'approved',
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('🏗️ Processed opportunity:', JSON.stringify(opportunity, null, 2));

    try {
      const db = getAdminDb();
      // Use the provided ID instead of generating a new one
      await db
        .collection(getFullCollectionName('opportunities'))
        .doc(body.id)
        .set(opportunity);
      console.log('✅ Opportunity created with ID:', body.id);

      return NextResponse.json({
        id: body.id,
        message: 'Opportunity created successfully',
      });
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      return NextResponse.json(
        {
          error: 'Database error',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error in POST /api/opportunities:', error);
    return NextResponse.json({ error: 'Failed to create opportunity' }, { status: 500 });
  }
}

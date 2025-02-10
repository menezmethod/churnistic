import { Query, QuerySnapshot } from 'firebase-admin/firestore';
import { type NextRequest, NextResponse } from 'next/server';

import { createAuthContext } from '@/lib/auth/authUtils';
import { getAdminDb } from '@/lib/firebase/admin';
import { type Opportunity } from '@/types/opportunity';

// Helper function to normalize search terms
function normalizeSearchTerm(term: string): string {
  return term.toLowerCase().trim();
}

// Helper function to create search tokens
function createSearchTokens(text: string): string[] {
  const normalized = normalizeSearchTerm(text);
  const words = normalized.split(/\s+/);
  const tokens = new Set<string>();

  // Add individual words
  words.forEach((word) => {
    if (word.length > 0) {
      tokens.add(word);
    }
  });

  // Add combinations of consecutive words (for phrase matching)
  for (let i = 0; i < words.length - 1; i++) {
    tokens.add(`${words[i]} ${words[i + 1]}`);
  }

  return Array.from(tokens);
}

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

    const collectionRef = db.collection('opportunities');
    let queryRef: Query = collectionRef;

    // Apply filters
    if (status) {
      const statuses = status.split(',').map((s) => s.trim());
      if (statuses.length > 0) {
        if (statuses.length === 1) {
          queryRef = queryRef.where('status', '==', statuses[0]);
        } else {
          queryRef = queryRef.where('status', 'in', statuses);
        }
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

    // Enhanced search functionality
    let searchResults: QuerySnapshot | null = null;
    if (search) {
      const searchTokens = createSearchTokens(search);

      // If we have search tokens, perform a search across multiple fields
      if (searchTokens.length > 0) {
        // Create an array of promises for each search token
        const searchQueries = searchTokens.map((token) => {
          const nameQuery = collectionRef.where(
            'searchableFields.name',
            'array-contains',
            token
          );

          const descriptionQuery = collectionRef.where(
            'searchableFields.description',
            'array-contains',
            token
          );

          return Promise.all([nameQuery.get(), descriptionQuery.get()]);
        });

        // Execute all search queries in parallel
        const results = await Promise.all(searchQueries);

        // Merge results and remove duplicates
        const matchingDocs = new Map();
        results.flat(2).forEach((snapshot) => {
          snapshot.docs.forEach((doc) => {
            if (!matchingDocs.has(doc.id)) {
              matchingDocs.set(doc.id, doc);
            }
          });
        });

        // Convert to array and sort by relevance (can be enhanced further)
        const sortedDocs = Array.from(matchingDocs.values()).sort((a, b) => {
          const aData = a.data();
          const bData = b.data();
          // Prioritize exact matches in name
          const aExactMatch = aData.name.toLowerCase().includes(search.toLowerCase());
          const bExactMatch = bData.name.toLowerCase().includes(search.toLowerCase());
          if (aExactMatch && !bExactMatch) return -1;
          if (!aExactMatch && bExactMatch) return 1;
          return 0;
        });

        // Create a new snapshot with the sorted results
        searchResults = {
          docs: sortedDocs,
          size: sortedDocs.length,
          empty: sortedDocs.length === 0,
        } as QuerySnapshot;
      }
    }

    // If we have search results, use them instead of the query
    const snapshot = searchResults || (await queryRef.get());

    console.log('📊 Query snapshot:', {
      size: snapshot.size,
      empty: snapshot.empty,
      docs: snapshot.docs.length,
    });

    if (snapshot.empty) {
      console.log('ℹ️ No opportunities found');
      return NextResponse.json({
        items: [],
        total: 0,
        hasMore: false,
      });
    }

    // Apply sorting to the results
    const opportunities = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Opportunity[];

    // Apply in-memory sorting if needed
    if (sortBy) {
      opportunities.sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'value':
            comparison = (a.value || 0) - (b.value || 0);
            break;
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'type':
            comparison = a.type.localeCompare(b.type);
            break;
          case 'date':
            comparison =
              new Date(a.metadata?.created_at || '').getTime() -
              new Date(b.metadata?.created_at || '').getTime();
            break;
        }
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const paginatedOpportunities = opportunities.slice(startIndex, startIndex + pageSize);
    const total = opportunities.length;
    const hasMore = total > startIndex + paginatedOpportunities.length;

    console.log('✅ Processed opportunities:', {
      count: paginatedOpportunities.length,
      total,
      hasMore,
      sample: paginatedOpportunities[0] && {
        id: paginatedOpportunities[0].id,
        name: paginatedOpportunities[0].name,
        type: paginatedOpportunities[0].type,
      },
    });

    return NextResponse.json({
      items: paginatedOpportunities,
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
      await db.collection('opportunities').doc(body.id).set(opportunity);
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

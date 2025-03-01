import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

import { createAuthContext } from '@/lib/auth/authUtils';
import { type Opportunity } from '@/types/opportunity';

// Helper function to map column names based on database schema
function mapColumnName(columnName: string, tableInfo: any[]): string {
  if (!tableInfo || tableInfo.length === 0) {
    return columnName; // No info to map with, return original
  }
  
  const availableColumns = Object.keys(tableInfo[0]);
  
  // Direct match
  if (availableColumns.includes(columnName)) {
    return columnName;
  }
  
  // Try camelCase to snake_case
  if (columnName.includes('_')) {
    // Convert snake_case to camelCase
    const camelCase = columnName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    if (availableColumns.includes(camelCase)) {
      console.log(`🔄 Mapped column from ${columnName} to ${camelCase}`);
      return camelCase;
    }
  } else {
    // Convert camelCase to snake_case
    const snakeCase = columnName.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (availableColumns.includes(snakeCase)) {
      console.log(`🔄 Mapped column from ${columnName} to ${snakeCase}`);
      return snakeCase;
    }
  }
  
  // Special cases
  if (columnName === 'created_at' && availableColumns.includes('createdat')) {
    return 'createdat';
  }
  if (columnName === 'updated_at' && availableColumns.includes('updatedat')) {
    return 'updatedat';
  }
  
  // No mapping found, return original
  return columnName;
}

export async function GET(request: NextRequest) {
  try {
    console.log('📥 GET /api/opportunities - Starting request');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const sortBy = searchParams.get('sortBy') || 'created_at';
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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const startIndex = (page - 1) * pageSize;

    // Get table info to check column names
    const { data: tableInfo, error: tableInfoError } = await supabase
      .from('opportunities')
      .select('*')
      .limit(1);
    
    if (tableInfoError) {
      console.error('❌ Error fetching table info:', tableInfoError);
      return NextResponse.json(
        { error: 'Failed to fetch opportunities' },
        { status: 500 }
      );
    }

    console.log('📊 Table columns:', tableInfo && tableInfo.length > 0 ? Object.keys(tableInfo[0]) : 'No data');

    // Build the query
    let query = supabase.from('opportunities').select('*', { count: 'exact' });

    // Apply filters
    if (status) {
      const statuses = status.split(',').map((s) => s.trim());
      if (statuses.length === 1) {
        query = query.eq('status', statuses[0]);
      } else {
        query = query.in('status', statuses);
      }
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (minValue !== undefined) {
      query = query.gte('value', minValue);
    }

    if (maxValue !== undefined) {
      query = query.lte('value', maxValue);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Map sortBy to the correct column name based on what exists in the database
    let actualSortBy = mapColumnName(sortBy, tableInfo || []);
    
    console.log('🔢 Using sort column:', actualSortBy);

    // Apply sorting and pagination
    const {
      data: opportunities,
      error,
      count,
    } = await query
      .order(actualSortBy, { ascending: sortDirection === 'asc' })
      .range(startIndex, startIndex + pageSize - 1);

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch opportunities' },
        { status: 500 }
      );
    }

    const total = count || 0;
    const hasMore = total > startIndex + (opportunities?.length || 0);

    console.log('✅ Processed opportunities:', {
      count: opportunities?.length || 0,
      total,
      hasMore,
      sample: opportunities?.[0] && {
        id: opportunities[0].id,
        name: opportunities[0].name,
        type: opportunities[0].type,
      },
    });

    return NextResponse.json({
      items: opportunities || [],
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

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Create the opportunity object
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
      bonus: body.bonus || {
        title: '',
        description: '',
        requirements: {
          title: '',
          description: '',
        },
        additional_info: null,
        tiers: null,
      },
      details: body.details || {
        monthly_fees: {
          amount: '0',
        },
        account_type: '',
        availability: {
          type: 'Nationwide',
          states: [],
        },
        credit_inquiry: null,
        household_limit: null,
        early_closure_fee: null,
        chex_systems: null,
        expiration: null,
        options_trading: null,
        ira_accounts: null,
        under_5_24: null,
        foreign_transaction_fees: null,
        annual_fees: null,
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
    };

    // Get table info to check column names for metadata
    const { data: tableInfo, error: tableInfoError } = await supabase
      .from('opportunities')
      .select('*')
      .limit(1);
    
    if (tableInfoError) {
      console.error('❌ Error fetching table info:', tableInfoError);
      return NextResponse.json(
        { error: 'Failed to create opportunity' },
        { status: 500 }
      );
    }

    // Create metadata with properly mapped column names
    const metadata = {
      ...(body.metadata || {}),
    };

    // Map common metadata fields
    const metadataFields = {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: body.metadata?.created_by || 'system',
      updated_by: body.metadata?.updated_by || 'system',
      status: body.metadata?.status || 'active',
      environment: process.env.NODE_ENV || 'development',
    };

    // Add mapped fields to metadata
    Object.entries(metadataFields).forEach(([key, value]) => {
      const mappedKey = mapColumnName(key, tableInfo || []);
      metadata[mappedKey] = value;
    });

    // Add metadata to opportunity
    opportunity.metadata = metadata;

    console.log('📦 Opportunity to insert:', JSON.stringify({
      id: opportunity.id,
      name: opportunity.name,
      type: opportunity.type,
      metadata: opportunity.metadata
    }, null, 2));

    const { error } = await supabase
      .from('opportunities')
      .insert([opportunity])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating opportunity:', error);
      return NextResponse.json(
        { error: 'Failed to create opportunity' },
        { status: 500 }
      );
    }

    return NextResponse.json(opportunity, { status: 201 });
  } catch (error) {
    console.error('❌ Error in POST /api/opportunities:', error);
    return NextResponse.json({ error: 'Failed to create opportunity' }, { status: 500 });
  }
}

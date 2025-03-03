import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BulkOperationResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  debug?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the authorization header and log it (safely)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    console.log('Auth header present:', !!authHeader);
    
    // Log environment variables (safely)
    console.log('SUPABASE_URL present:', !!Deno.env.get('SUPABASE_URL'));
    console.log('SUPABASE_SERVICE_ROLE_KEY present:', !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get action from URL params
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    console.log('Requested action:', action);

    let response: BulkOperationResponse;

    switch (action) {
      case 'bulk_approve':
        response = await handleBulkApprove(supabaseClient);
        break;
      case 'reset_staged':
        response = await handleResetStaged(supabaseClient);
        break;
      case 'reset_all':
        response = await handleResetAll(supabaseClient);
        break;
      case 'import':
        response = await handleImport(supabaseClient);
        break;
      case 'create_functions':
        response = await handleCreateFunctions(supabaseClient);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Operation failed:', error);
    
    const errorResponse: BulkOperationResponse = {
      success: false,
      message: 'Operation failed',
      error: error.message,
      debug: {
        url: req.url,
        method: req.method,
        hasAuth: !!req.headers.get('Authorization'),
        hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
        hasServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

async function handleBulkApprove(supabaseClient: any): Promise<BulkOperationResponse> {
  // First, get all staged offers
  const { data: stagedOffers, error: fetchError } = await supabaseClient
    .from('staged_offers')
    .select('*');

  if (fetchError) throw fetchError;

  if (!stagedOffers || stagedOffers.length === 0) {
    return {
      success: true,
      message: 'No staged offers to approve',
      data: [],
    };
  }

  // Insert staged offers into opportunities table
  const { error: insertError } = await supabaseClient
    .from('opportunities')
    .insert(
      stagedOffers.map(offer => ({
        ...offer,
        processing_status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
    );

  if (insertError) throw insertError;

  // Clear staged offers
  const { error: clearError } = await supabaseClient
    .from('staged_offers')
    .delete()
    .neq('id', 0);

  if (clearError) throw clearError;

  return {
    success: true,
    message: 'Successfully approved all staged opportunities',
    data: stagedOffers,
  };
}

async function handleResetStaged(supabaseClient: any): Promise<BulkOperationResponse> {
  const { data, error } = await supabaseClient
    .from('staged_offers')
    .delete()
    .neq('id', 0);

  if (error) throw error;

  return {
    success: true,
    message: 'Successfully reset staged offers',
    data,
  };
}

async function handleResetAll(supabaseClient: any): Promise<BulkOperationResponse> {
  const { data, error } = await supabaseClient
    .from('opportunities')
    .delete()
    .neq('id', 0);

  if (error) throw error;

  const { error: error2 } = await supabaseClient
    .from('staged_offers')
    .delete()
    .neq('id', 0);

  if (error2) throw error2;

  return {
    success: true,
    message: 'Successfully reset all opportunities',
    data,
  };
}

async function handleImport(supabaseClient: any): Promise<BulkOperationResponse> {
  try {
    // Get bank rewards offers from the RPC function
    const { data: bankRewardsData, error: fetchError } = await supabaseClient.rpc('get_bank_rewards_offers');

    if (fetchError) {
      throw new Error(`Failed to fetch bank rewards offers: ${fetchError.message}`);
    }

    if (!bankRewardsData?.offers || !Array.isArray(bankRewardsData.offers)) {
      throw new Error('No valid offers found in bank rewards data');
    }

    // Transform offers to match staged_offers schema
    const transformedOffers = bankRewardsData.offers.map((offer: any) => ({
      id: offer.id,
      name: offer.name,
      type: offer.type,
      bank: offer.name?.split(' ')?.[0] || offer.name || '',
      value: offer.value || 0,
      status: 'staged',
      metadata: {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: '',
        updated_by: '',
        status: 'active',
        environment: Deno.env.get('ENVIRONMENT') || 'development',
      },
      source: {
        name: 'bankrewards.io',
        collected_at: new Date().toISOString(),
        original_id: offer.id,
        timing: null,
        availability: null,
        credit: null,
      },
      source_id: offer.id,
      bonus: {
        title: offer.bonus?.title || '',
        value: offer.value || 0,
        description: offer.bonus?.description || '',
        requirements: {
          description: offer.bonus?.requirements?.description || '',
          spending_requirement: offer.bonus?.requirements?.spending_requirement || null,
          minimum_deposit: offer.bonus?.requirements?.minimum_deposit || null,
        },
        tiers: offer.bonus?.tiers?.map((tier: any) => ({
          reward: tier.reward || '',
          deposit: tier.deposit || '',
          level: tier.level || null,
          value: tier.value ?? null,
          minimum_deposit: tier.minimum_deposit ?? null,
          requirements: tier.requirements || null,
        })) || null,
        additional_info: offer.bonus?.additional_info || null,
      },
      details: {
        monthly_fees: offer.details?.monthly_fees || null,
        annual_fees: offer.details?.annual_fees || null,
        account_type: offer.details?.account_type || null,
        account_category: offer.details?.account_category || null,
        availability: offer.details?.availability || null,
        credit_inquiry: offer.details?.credit_inquiry || null,
        expiration: offer.details?.expiration || null,
        credit_score: offer.details?.credit_score || null,
        under_5_24: offer.details?.under_5_24 || null,
        foreign_transaction_fees: offer.details?.foreign_transaction_fees || null,
        minimum_credit_limit: offer.details?.minimum_credit_limit || null,
        rewards_structure: offer.details?.rewards_structure ? {
          base_rewards: offer.details.rewards_structure.base_rewards || '',
          bonus_categories: offer.details.rewards_structure.bonus_categories || [],
          welcome_bonus: offer.details.rewards_structure.welcome_bonus || '',
          card_perks: offer.details.rewards_structure.card_perks || null,
          cash_back: offer.details.rewards_structure.cash_back || null,
          points_multiplier: offer.details.rewards_structure.points_multiplier || null,
          statement_credits: offer.details.rewards_structure.statement_credits || null,
        } : null,
        household_limit: offer.details?.household_limit || null,
        early_closure_fee: offer.details?.early_closure_fee || null,
        chex_systems: offer.details?.chex_systems || null,
        options_trading: offer.details?.options_trading || null,
        ira_accounts: offer.details?.ira_accounts || null,
        minimum_deposit: offer.details?.minimum_deposit || null,
        holding_period: offer.details?.holding_period || null,
        trading_requirements: offer.details?.trading_requirements || null,
        platform_features: offer.details?.platform_features || null,
      },
      logo: offer.logo || {
        type: '',
        url: '',
      },
      card_image: offer.card_image || null,
      offer_link: offer.offer_link || '',
      description: offer.description || offer.bonus?.description || '',
      processing_status: {
        source_validation: true,
        ai_processed: false,
        duplicate_checked: false,
        needs_review: true,
      },
      ai_insights: {
        confidence_score: 0.8,
        validation_warnings: [],
        potential_duplicates: [],
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Insert transformed offers into staged_offers table
    const { error: insertError } = await supabaseClient
      .from('staged_offers')
      .insert(transformedOffers);

    if (insertError) {
      throw new Error(`Failed to insert offers: ${insertError.message}`);
    }

    return {
      success: true,
      message: `Successfully imported ${transformedOffers.length} opportunities`,
      data: {
        imported_count: transformedOffers.length,
      },
    };
  } catch (error) {
    console.error('Import error:', error);
    return {
      success: false,
      message: 'Failed to import opportunities',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

async function handleCreateFunctions(supabaseClient: any): Promise<BulkOperationResponse> {
  // Create reset_all_opportunities function
  await supabaseClient.rpc('exec_sql', {
    sql: `
      CREATE OR REPLACE FUNCTION reset_all_opportunities()
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        TRUNCATE TABLE opportunities;
        ALTER SEQUENCE opportunities_id_seq RESTART WITH 1;
        TRUNCATE TABLE staged_offers;
        ALTER SEQUENCE staged_offers_id_seq RESTART WITH 1;
      END;
      $$;
    `
  });

  // Create reset_staged_offers function
  await supabaseClient.rpc('exec_sql', {
    sql: `
      CREATE OR REPLACE FUNCTION reset_staged_offers()
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        TRUNCATE TABLE staged_offers;
        ALTER SEQUENCE staged_offers_id_seq RESTART WITH 1;
      END;
      $$;
    `
  });

  // Create bulk_approve_opportunities function
  await supabaseClient.rpc('exec_sql', {
    sql: `
      CREATE OR REPLACE FUNCTION bulk_approve_opportunities()
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        INSERT INTO opportunities (
          type,
          source,
          logo,
          card_image,
          bonus,
          details,
          metadata,
          ai_insights,
          processing_status,
          created_at,
          updated_at
        )
        SELECT
          type,
          source,
          logo,
          card_image,
          bonus,
          details,
          metadata,
          ai_insights,
          'approved'::opportunity_status,
          NOW(),
          NOW()
        FROM staged_offers;

        TRUNCATE TABLE staged_offers;
        ALTER SEQUENCE staged_offers_id_seq RESTART WITH 1;
      END;
      $$;
    `
  });

  // Create import_opportunities function
  await supabaseClient.rpc('exec_sql', {
    sql: `
      CREATE OR REPLACE FUNCTION import_opportunities()
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        -- This is a placeholder. The actual import will be handled by the Edge Function
        NULL;
      END;
      $$;
    `
  });

  return {
    success: true,
    message: 'Successfully created all database functions',
  };
} 
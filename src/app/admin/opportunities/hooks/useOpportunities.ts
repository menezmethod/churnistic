'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useState } from 'react';

import { supabase } from '@/lib/supabase/client';

import {
  Opportunity,
  Requirement,
  RequirementType,
  BankRewardsOffer,
} from '../types/opportunity';

interface PaginationState {
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  filters: {
    status?: 'pending' | 'approved' | 'rejected';
    type?: string;
    minValue?: number;
    maxValue?: number;
    search?: string;
  };
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  avgValue: number;
  highValue: number;
  byType: {
    bank: number;
    credit_card: number;
    brokerage: number;
  };
  bankRewards?: {
    total: number;
    active: number;
    expired: number;
  };
  processingRate: string;
}

interface PaginatedResponse {
  items: Opportunity[];
  total: number;
  hasMore: boolean;
}

const ITEMS_PER_PAGE = 20;

// Default stats object to use as fallback
const defaultStats: Stats = {
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  avgValue: 0,
  highValue: 0,
  byType: {
    bank: 0,
    credit_card: 0,
    brokerage: 0,
  },
  bankRewards: {
    total: 0,
    active: 0,
    expired: 0,
  },
  processingRate: '0%',
};

// Keeping these functions (though unused) as they might be needed in the future
// or for reference as per the TODO comment at the top of the file
/* eslint-disable @typescript-eslint/no-unused-vars */
const parseRequirements = (
  description: string = '',
  type: 'bank' | 'credit_card' | 'brokerage',
  offerDetails: BankRewardsOffer['details']
): Requirement[] => {
  const requirements: Requirement[] = [];

  // Minimum deposit requirement
  if (offerDetails?.minimum_deposit) {
    const amount = parseFloat(offerDetails.minimum_deposit.replace(/[^0-9.]/g, ''));
    requirements.push({
      type: 'minimum_deposit' as RequirementType,
      details: { amount, period: 0 },
      description: `Maintain a minimum deposit of $${amount.toLocaleString()}`,
      title: 'Minimum Deposit Requirement',
    });
  }

  // Spending requirement pattern
  const spendMatch = description.match(
    /spend\s*\$?(\d+[,\d]*)\s*(?:in|within)?\s*(\d+)\s*(month|months|day|days)/i
  );
  if (spendMatch && type === 'credit_card') {
    const amount = parseInt(spendMatch[1].replace(/,/g, ''));
    const period =
      parseInt(spendMatch[2]) *
      (spendMatch[3].toLowerCase().startsWith('month') ? 30 : 1);
    requirements.push({
      type: 'spending' as RequirementType,
      details: { amount, period },
      description: `Spend $${amount.toLocaleString()} within ${period} days`,
      title: 'Spending Requirement',
    });
  }

  // Direct deposit pattern
  const ddMatch = description.match(
    /(?:direct )?deposit\s*(?:of)?\s*\$?(\d+[,\d]*(?:\.\d+)?)/i
  );
  if (ddMatch && type === 'bank') {
    const amount = parseFloat(ddMatch[1].replace(/,/g, ''));
    requirements.push({
      type: 'direct_deposit' as RequirementType,
      details: { amount, period: 60 }, // Default to 60 days if not specified
      description: `Make a direct deposit of $${amount.toLocaleString()}`,
      title: 'Direct Deposit Requirement',
    });
  }

  // Debit transactions requirement
  const debitMatch = description.match(/(\d+)\s*(?:debit|purchase|transaction)/i);
  if (debitMatch && type === 'bank') {
    const count = parseInt(debitMatch[1]);
    requirements.push({
      type: 'debit_transactions' as RequirementType,
      details: { amount: 0, period: 60, count }, // Default to 60 days
      description: `Make ${count} debit card transactions`,
      title: 'Debit Card Requirement',
    });
  }

  // Account closure requirement
  const closureMatch = description.match(
    /(?:not|don't|do not)\s*close.*?(\d+)\s*(day|days)/i
  );
  if (closureMatch) {
    const period = parseInt(closureMatch[1]);
    requirements.push({
      type: 'account_closure' as RequirementType,
      details: { amount: 0, period },
      description: `Keep account open for ${period} days`,
      title: 'Account Duration Requirement',
    });
  }

  // If no specific requirements found but we have a description
  if (requirements.length === 0 && description.trim()) {
    // Default requirement based on type
    const defaultReq: Requirement = {
      type: (type === 'credit_card'
        ? 'spending'
        : type === 'bank'
          ? 'direct_deposit'
          : 'deposit') as RequirementType,
      details: {
        amount: 0,
        period: 60,
      },
      description: description.trim(),
      title: 'Bonus Requirements',
    };
    requirements.push(defaultReq);
  }

  return requirements;
};




// Query keys for React Query
// Keeping this for future reference when migrating to Supabase
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-enable @typescript-eslint/no-unused-vars */

interface UseOpportunitiesReturn {
  pagination: PaginationState;
  setPagination: (pagination: PaginationState) => void;
  stats: Stats;
  stagedOpportunities: (Opportunity & { isStaged: boolean })[];
  approvedOpportunities: Opportunity[];
  rejectedOpportunities: Opportunity[];
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  approveOpportunity: (opportunity: Opportunity) => void;
  rejectOpportunity: (opportunity: Opportunity & { isStaged?: boolean }) => void;
  bulkApproveOpportunities: () => void;
  isBulkApproving: boolean;
  importOpportunities: () => void;
  isImporting: boolean;
  hasStagedOpportunities: boolean;
  resetStagedOffers: () => void;
  isResettingStagedOffers: boolean;
  resetOpportunities: () => void;
  isResettingOpportunities: boolean;
  queryClient: ReturnType<typeof useQueryClient>;
  loadingStates: {
    [key: string]: boolean; // Track loading state for individual items
  };
  createFunctions: () => void;
  isCreatingFunctions: boolean;
}

export function useOpportunities(): UseOpportunitiesReturn {
  const queryClient = useQueryClient();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: ITEMS_PER_PAGE,
    sortBy: 'created_at',
    sortDirection: 'desc',
    filters: {},
  });

  // Fetch opportunities with pagination and filters
  const {
    isLoading: isLoadingPaginated,
    isFetching,
    error,
  } = useQuery<PaginatedResponse>({
    queryKey: ['opportunities', pagination],
    queryFn: async () => {
      try {
        // Check if we have a valid session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No authenticated session found');
        }

        // DIAGNOSTIC: Check database schema
        console.log('🔍 Checking database schema...');
        const { data: schemaInfo, error: schemaError } = await supabase
          .rpc('get_schema_info', { table_name: 'opportunities' });
        
        if (schemaError) {
          console.log('❌ Schema check failed:', schemaError);
        } else {
          console.log('📋 Table schema:', schemaInfo);
        }

        // DIAGNOSTIC: List all functions
        console.log('🔍 Checking available functions...');
        const { data: functions, error: functionsError } = await supabase
          .from('pg_catalog.pg_proc')
          .select('proname')
          .eq('pronamespace', 'public');

        if (functionsError) {
          console.log('❌ Function check failed:', functionsError);
        } else {
          console.log('📋 Available functions:', functions);
        }

        // First, let's check if we can access the table
        console.log('🔍 Attempting to describe opportunities table...');
        const { data: tableInfo, error: tableError } = await supabase
          .from('opportunities')
          .select('*')
          .limit(1);

        if (tableError) {
          console.error('❌ Table access error:', {
            error: tableError,
            code: tableError.code,
            details: tableError.details,
            hint: tableError.hint
          });
          throw tableError;
        } else {
          console.log('📋 Table structure:', tableInfo ? Object.keys(tableInfo[0]) : 'No data');
        }

        let query = supabase
          .from('opportunities')
          .select('id, name, type, value, status, created_at, updated_at, card_image, offer_link, processing_status, ai_insights, source_id', { 
            count: 'exact' 
          })
          .range(
            (pagination.page - 1) * pagination.pageSize,
            pagination.page * pagination.pageSize - 1
          )
          .order('created_at', {
            ascending: pagination.sortDirection === 'asc',
          });

        // Apply filters
        if (pagination.filters.status) {
          console.log('🏷️ Applying status filter:', pagination.filters.status);
          query = query.eq('status', pagination.filters.status);
        }
        if (pagination.filters.type) {
          query = query.eq('type', pagination.filters.type);
        }
        if (pagination.filters.minValue) {
          query = query.gte('value', pagination.filters.minValue);
        }
        if (pagination.filters.maxValue) {
          query = query.lte('value', pagination.filters.maxValue);
        }
        if (pagination.filters.search) {
          query = query.ilike('name', `%${pagination.filters.search}%`);
        }

        const { data, error: queryError, count } = await query;

        if (queryError) {
          console.error('❌ Query error:', {
            error: queryError,
            details: queryError.details,
            hint: queryError.hint,
            code: queryError.code
          });
          throw queryError;
        }

        console.log('✅ Query successful:', {
          resultCount: data?.length || 0,
          totalCount: count,
          firstRow: data?.[0] ? Object.keys(data[0]) : 'No data'
        });

        return {
          items: data || [],
          total: count || 0,
          hasMore: (count || 0) > pagination.page * pagination.pageSize,
        };
      } catch (error) {
        console.error('❌ Error fetching opportunities:', error);
        throw error;
      }
    },
    placeholderData: keepPreviousData,
  });

  // Fetch staged opportunities
  const { data: stagedOpportunities = [], isLoading: isLoadingStaged } = useQuery({
    queryKey: ['opportunities', 'staged'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staged_offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Map the data to match your frontend types
      return data?.map((item: Record<string, any>) => ({
        ...item,
        created_at: item.created_at,
        updated_at: item.updated_at,
        card_image: item.card_image,
        offer_link: item.offer_link,
        processing_status: item.processing_status,
        ai_insights: item.ai_insights,
        source_id: item.source_id,
        isStaged: true,
      })) || [];
    },
  });

  // Fetch approved opportunities
  const { data: approvedOpportunities = [], isLoading: isLoadingApproved } = useQuery({
    queryKey: ['opportunities', 'approved'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Map the data to match your frontend types
      return data?.map((item: Record<string, any>) => ({
        ...item,
        created_at: item.created_at,
        updated_at: item.updated_at,
        card_image: item.card_image,
        offer_link: item.offer_link,
        processing_status: item.processing_status,
        ai_insights: item.ai_insights,
        source_id: item.source_id,
      })) || [];
    },
  });

  // Fetch rejected opportunities
  const { data: rejectedOpportunities = [], isLoading: isLoadingRejected } = useQuery({
    queryKey: ['opportunities', 'rejected'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('status', 'rejected')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Map the data to match your frontend types
      return data?.map((item: Record<string, any>) => ({
        ...item,
        created_at: item.created_at,
        updated_at: item.updated_at,
        card_image: item.card_image,
        offer_link: item.offer_link,
        processing_status: item.processing_status,
        ai_insights: item.ai_insights,
        source_id: item.source_id,
      })) || [];
    },
  });

  // Fetch stats with diagnostic logging
  const { data: stats = defaultStats } = useQuery({
    queryKey: ['opportunities', 'stats'],
    queryFn: async () => {
      console.log('📊 Attempting to fetch opportunity stats...');
      
      // First check if the function exists
      const { data: functions, error: functionError } = await supabase
        .rpc('get_available_functions');
        
      if (functionError) {
        console.error('❌ Error checking available functions:', functionError);
      } else {
        console.log('📋 Available functions:', functions);
      }

      const { data, error } = await supabase.rpc('get_opportunity_stats');

      if (error) {
        console.error('❌ Stats error:', error);
        throw error;
      }

      console.log('✅ Stats fetched successfully:', data);
      return data;
    },
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: async (opportunity: Opportunity) => {
      const { error } = await supabase.rpc('approve_opportunity', {
        p_opportunity_id: opportunity.id,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (opportunity: Opportunity) => {
      const { error } = await supabase.rpc('reject_opportunity', {
        p_opportunity_id: opportunity.id,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  const bulkApproveMutation = useMutation({
    mutationFn: async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('No authenticated user found');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/bulk-operations?action=bulk_approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ force: false }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to bulk approve opportunities');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'staged'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'approved'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'stats'] });
    },
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('No authenticated user found');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/bulk-operations?action=import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to import opportunities');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'staged'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'approved'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'stats'] });
    },
  });

  const resetStagedMutation = useMutation({
    mutationFn: async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('No authenticated user found');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/bulk-operations?action=reset_staged`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reset staged offers');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'staged'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'approved'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'stats'] });
    },
  });

  const resetOpportunitiesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/bulk-operations?action=reset_all`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${supabase.auth.getSession()?.data.session?.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reset opportunities');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['staged-offers'] });
    },
  });

  const createFunctionsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/bulk-operations?action=create_functions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${supabase.auth.getSession()?.data.session?.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create database functions');
      }

      return response.json();
    },
  });

  const isQueryLoading =
    isLoadingPaginated || isLoadingStaged || isLoadingApproved || isLoadingRejected;

  return {
    pagination,
    setPagination,
    stats,
    stagedOpportunities,
    approvedOpportunities,
    rejectedOpportunities,
    isLoading: isQueryLoading,
    isFetching,
    error,
    approveOpportunity: (opportunity) => {
      setLoadingStates({ ...loadingStates, [opportunity.id]: true });
      approveMutation.mutate(opportunity, {
        onSettled: () => {
          setLoadingStates({ ...loadingStates, [opportunity.id]: false });
        },
      });
    },
    rejectOpportunity: (opportunity) => {
      setLoadingStates({ ...loadingStates, [opportunity.id]: true });
      rejectMutation.mutate(opportunity, {
        onSettled: () => {
          setLoadingStates({ ...loadingStates, [opportunity.id]: false });
        },
      });
    },
    bulkApproveOpportunities: () => {
      bulkApproveMutation.mutate();
    },
    isBulkApproving: bulkApproveMutation.isPending,
    importOpportunities: () => {
      importMutation.mutate();
    },
    isImporting: importMutation.isPending,
    hasStagedOpportunities: stagedOpportunities.length > 0,
    resetStagedOffers: () => {
      resetStagedMutation.mutate();
    },
    isResettingStagedOffers: resetStagedMutation.isPending,
    resetOpportunities: resetOpportunitiesMutation.mutate,
    isResettingOpportunities: resetOpportunitiesMutation.isPending,
    queryClient,
    loadingStates,
    createFunctions: createFunctionsMutation.mutate,
    isCreatingFunctions: createFunctionsMutation.isPending,
  };
}

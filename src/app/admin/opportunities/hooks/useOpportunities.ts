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
  Details,
  Opportunity,
  Requirement,
  RequirementType,
  BankRewardsOffer,
  BankRewardsResponse,
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

const transformBankRewardsOffer = (offer: BankRewardsOffer): Opportunity => {
  const bank = offer.name?.split(' ')?.[0] || offer.name || '';

  // Transform bonus
  const bonus = {
    title: offer.bonus?.title || '',
    value: offer.value || 0,
    description: offer.bonus?.description || '',
    requirements: parseRequirements(
      offer.bonus?.requirements?.description,
      offer.type,
      offer.details
    ),
    tiers:
      offer.bonus?.tiers?.map((tier) => ({
        reward: tier.reward || '',
        deposit: tier.deposit || '',
        level: tier.level || null,
        value: tier.value ?? null,
        minimum_deposit: tier.minimum_deposit ?? null,
        requirements: tier.requirements || null,
      })) || null,
    additional_info: offer.bonus?.additional_info || null,
  };

  // Transform details with all possible fields
  const details: Details = {
    monthly_fees: offer.details?.monthly_fees
      ? {
          amount: offer.details.monthly_fees.amount || '0',
          waiver_details: offer.details.monthly_fees.waiver_details || null,
        }
      : null,
    annual_fees: offer.details?.annual_fees
      ? {
          amount: offer.details.annual_fees.amount || '0',
          waived_first_year: offer.details.annual_fees.waived_first_year || false,
        }
      : null,
    account_type: offer.details?.account_type || null,
    account_category: offer.details?.account_category || null,
    availability: offer.details?.availability
      ? {
          type: offer.details.availability.type || 'Nationwide',
          states: offer.details.availability.states || null,
          is_nationwide: offer.details.availability.is_nationwide ?? true,
          details: offer.details.availability.details || null,
        }
      : null,
    credit_inquiry: offer.details?.credit_inquiry || null,
    expiration: offer.details?.expiration || null,
    credit_score: offer.details?.credit_score || null,
    under_5_24: offer.details?.under_5_24 ?? null,
    foreign_transaction_fees: offer.details?.foreign_transaction_fees
      ? {
          percentage: offer.details.foreign_transaction_fees.percentage || '0',
          waived: offer.details.foreign_transaction_fees.waived || false,
        }
      : null,
    minimum_credit_limit: offer.details?.minimum_credit_limit || null,
    rewards_structure: offer.details?.rewards_structure
      ? {
          base_rewards: offer.details.rewards_structure.base_rewards || '',
          bonus_categories: offer.details.rewards_structure.bonus_categories || [],
          welcome_bonus: offer.details.rewards_structure.welcome_bonus || '',
          card_perks: offer.details.rewards_structure.card_perks,
          cash_back: offer.details.rewards_structure.cash_back,
          points_multiplier: offer.details.rewards_structure.points_multiplier,
          statement_credits: offer.details.rewards_structure.statement_credits,
        }
      : null,
    household_limit: offer.details?.household_limit || null,
    early_closure_fee: offer.details?.early_closure_fee || null,
    chex_systems: offer.details?.chex_systems || null,
    options_trading: offer.details?.options_trading || null,
    ira_accounts: offer.details?.ira_accounts || null,
    minimum_deposit: offer.details?.minimum_deposit || null,
    holding_period: offer.details?.holding_period || null,
    trading_requirements: offer.details?.trading_requirements || null,
    platform_features: offer.details?.platform_features || null,
  };

  return {
    id: offer.id,
    name: offer.name,
    type: offer.type,
    bank,
    value: offer.value,
    status: 'staged' as const,
    metadata: {
      created_at: offer.metadata?.created_at || new Date().toISOString(),
      updated_at: offer.metadata?.updated_at || new Date().toISOString(),
      created_by: offer.metadata?.created_by || '',
      updated_by: offer.metadata?.updated_by || '',
      status: (offer.metadata?.status || 'active') as 'active' | 'expired' | 'staged',
      environment: process.env.NODE_ENV || 'development',
    },
    source: {
      name: offer.metadata?.source?.name || 'bankrewards.io',
      collected_at: new Date().toISOString(),
      original_id: offer.metadata?.source?.original_id || offer.id,
      timing: offer.metadata?.timing || null,
      availability: offer.metadata?.availability || null,
      credit: offer.metadata?.credit || null,
    },
    source_id: offer.metadata?.source?.original_id || offer.id,
    bonus,
    details,
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
    createdAt: offer.metadata?.created_at || new Date().toISOString(),
    updatedAt: offer.metadata?.updated_at || new Date().toISOString(),
  };
};

const fetchBankRewardsOffers = async (): Promise<BankRewardsResponse> => {
  const { data, error } = await supabase.rpc('get_bank_rewards_offers');

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

const fetchStagedOpportunities = async (): Promise<
  (Opportunity & { isStaged: boolean })[]
> => {
  const { data, error } = await supabase
    .from('staged_offers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data.map((offer: Record<string, unknown>) => ({
    ...offer,
    isStaged: true,
  }));
};

// Query keys for React Query
// Keeping this for future reference when migrating to Supabase
/* eslint-disable @typescript-eslint/no-unused-vars */
const queryKeys = {
  opportunities: {
    all: ['opportunities'] as const,
    paginated: (pagination: PaginationState) =>
      ['opportunities', 'paginated', pagination] as const,
    staged: ['opportunities', 'staged'] as const,
    approved: ['opportunities', 'approved'] as const,
    rejected: ['opportunities', 'rejected'] as const,
    stats: ['opportunities', 'stats'] as const,
  },
};
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
    // Not using paginatedData directly, but kept as reference
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    data: paginatedData = { items: [], total: 0, hasMore: false },
    isLoading: isLoadingPaginated,
    isFetching,
    error,
  } = useQuery<PaginatedResponse>({
    queryKey: ['opportunities', pagination],
    queryFn: async () => {
      let query = supabase
        .from('opportunities')
        .select('*', { count: 'exact' })
        .range(
          (pagination.page - 1) * pagination.pageSize,
          pagination.page * pagination.pageSize - 1
        )
        .order(pagination.sortBy, {
          ascending: pagination.sortDirection === 'asc',
        });

      // Apply filters
      if (pagination.filters.status) {
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

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        items: data,
        total: count || 0,
        hasMore: (count || 0) > pagination.page * pagination.pageSize,
      };
    },
    placeholderData: keepPreviousData,
  });

  // Fetch staged opportunities
  const { data: stagedOpportunities = [], isLoading: isLoadingStaged } = useQuery({
    queryKey: ['opportunities', 'staged'],
    queryFn: fetchStagedOpportunities,
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

      return data;
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

      return data;
    },
  });

  // Fetch stats
  const { data: stats = defaultStats } = useQuery({
    queryKey: ['opportunities', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_opportunity_stats');

      if (error) {
        throw error;
      }

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
      const { error } = await supabase.rpc('bulk_approve_opportunities');

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('import_opportunities');

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  const resetStagedMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('reset_staged_offers');

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  const resetOpportunitiesMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('reset_opportunities');

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
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
    resetOpportunities: () => {
      resetOpportunitiesMutation.mutate();
    },
    isResettingOpportunities: resetOpportunitiesMutation.isPending,
    queryClient,
    loadingStates,
  };
}

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useState } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Database, Json } from '@/types/supabase';

import {
  Details,
  Requirement,
  RequirementType,
  BankRewardsOffer,
  BankRewardsResponse,
} from '../types/opportunity';

type OpportunityType = Database['public']['Enums']['opportunity_type'];
type Opportunity = Database['public']['Tables']['opportunities']['Row'];

interface PaginationState {
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  filters: {
    status?: 'pending' | 'approved' | 'rejected';
    type?: OpportunityType;
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

// Transform details to be Json compatible
const detailsToJson = (details: Details): Record<string, Json | undefined> => ({
  monthly_fees: details.monthly_fees
    ? {
        amount: details.monthly_fees.amount,
        waiver_details: details.monthly_fees.waiver_details,
      }
    : null,
  annual_fees: details.annual_fees
    ? {
        amount: details.annual_fees.amount,
        waived_first_year: details.annual_fees.waived_first_year,
      }
    : null,
  account_type: details.account_type,
  account_category: details.account_category,
  availability: details.availability
    ? {
        type: details.availability.type,
        states: details.availability.states,
        is_nationwide: details.availability.is_nationwide,
        details: details.availability.details,
      }
    : null,
  credit_inquiry: details.credit_inquiry,
  expiration: details.expiration,
  credit_score: details.credit_score,
  under_5_24: details.under_5_24,
  foreign_transaction_fees: details.foreign_transaction_fees
    ? {
        percentage: details.foreign_transaction_fees.percentage,
        waived: details.foreign_transaction_fees.waived,
      }
    : null,
  minimum_credit_limit: details.minimum_credit_limit,
  rewards_structure: details.rewards_structure
    ? {
        base_rewards: details.rewards_structure.base_rewards,
        bonus_categories: details.rewards_structure.bonus_categories,
        welcome_bonus: details.rewards_structure.welcome_bonus,
        card_perks: details.rewards_structure.card_perks,
        cash_back: details.rewards_structure.cash_back,
        points_multiplier: details.rewards_structure.points_multiplier,
        statement_credits: details.rewards_structure.statement_credits,
      }
    : null,
  household_limit: details.household_limit,
  early_closure_fee: details.early_closure_fee,
  chex_systems: details.chex_systems,
  options_trading: details.options_trading,
  ira_accounts: details.ira_accounts,
  minimum_deposit: details.minimum_deposit,
  holding_period: details.holding_period,
  trading_requirements: details.trading_requirements,
  platform_features: details.platform_features,
});

const transformBankRewardsOffer = (
  offer: BankRewardsOffer
): Database['public']['Tables']['opportunities']['Insert'] => {
  const bank = offer.name?.split(' ')?.[0] || offer.name || '';

  // Transform bonus to be Json compatible
  const bonus = {
    title: offer.bonus?.title || '',
    value: offer.value || 0,
    description: offer.bonus?.description || '',
    requirements: parseRequirements(
      offer.bonus?.requirements?.description,
      offer.type,
      offer.details
    ).map((req) => ({
      type: req.type,
      details: req.details,
      description: req.description,
      title: req.title,
    })),
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
  const details = detailsToJson({
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
  });

  return {
    title: offer.name,
    description: offer.description || offer.bonus?.description || '',
    type:
      offer.type === 'bank'
        ? 'bank_account'
        : (offer.type as Database['public']['Enums']['opportunity_type']),
    status: 'staged',
    metadata: {
      created_at: offer.metadata?.created_at || new Date().toISOString(),
      updated_at: offer.metadata?.updated_at || new Date().toISOString(),
      created_by: offer.metadata?.created_by || '',
      updated_by: offer.metadata?.updated_by || '',
      status: (offer.metadata?.status || 'active') as 'active' | 'expired' | 'staged',
      environment: process.env.NODE_ENV || 'development',
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
      bank,
      value: offer.value || 0,
      ai_insights: {
        confidence_score: 0.8,
        validation_warnings: [],
        potential_duplicates: [],
      },
    } satisfies Record<string, Json | undefined>,
  };
};

const fetchBankRewardsOffers = async (): Promise<BankRewardsResponse> => {
  try {
    const response = await fetch('/api/proxy/bankrewards?format=detailed', {
      method: 'GET',
      credentials: 'include',
      signal: AbortSignal.timeout(process.env.NODE_ENV === 'production' ? 10000 : 30000),
    });
    if (!response.ok)
      throw new Error(`BankRewards API failed with status ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('BankRewards API error:', error);
    return { data: { offers: [], stats: { total: 0, active: 0, expired: 0 } } };
  }
};

const fetchStagedOpportunities = async (): Promise<
  (Opportunity & { isStaged: boolean })[]
> => {
  const response = await fetch('/api/opportunities/staged', {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch staged opportunities');
  }
  const data = await response.json();
  return data.opportunities.map((opp: Opportunity) => ({
    ...opp,
    isStaged: true,
  }));
};

// Query keys for React Query
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
    sortBy: 'value',
    sortDirection: 'desc',
    filters: {},
  });

  const { user } = useAuth();

  useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Opportunity[];
    },
    enabled: !!user,
  });

  // Fetch paginated opportunities with better options
  const { error: paginatedError, isLoading: isLoadingPaginated } = useQuery({
    queryKey: queryKeys.opportunities.paginated(pagination),
    queryFn: async () => {
      const params = new URLSearchParams();

      // Add base pagination params
      params.set('page', pagination.page.toString());
      params.set('pageSize', pagination.pageSize.toString());
      params.set('sortBy', pagination.sortBy);
      params.set('sortDirection', pagination.sortDirection);

      // Add filters, converting numbers to strings
      if (pagination.filters.status) params.set('status', pagination.filters.status);
      if (pagination.filters.type) params.set('type', pagination.filters.type);
      if (pagination.filters.minValue)
        params.set('minValue', pagination.filters.minValue.toString());
      if (pagination.filters.maxValue)
        params.set('maxValue', pagination.filters.maxValue.toString());
      if (pagination.filters.search) params.set('search', pagination.filters.search);

      const response = await fetch(`/api/opportunities?${params}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Failed to fetch opportunities');
      }
      return response.json() as Promise<PaginatedResponse>;
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    retry: 2,
  });

  // Fetch stats with better options
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['opportunities', 'stats'],
    queryFn: async () => {
      const response = await fetch('/api/opportunities/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    retry: 2,
  });

  // Fetch staged opportunities
  const {
    data: stagedOpportunities = [],
    error: stagedError,
    isLoading: isLoadingStaged,
  } = useQuery({
    queryKey: queryKeys.opportunities.staged,
    queryFn: fetchStagedOpportunities,
  });

  // Fetch rejected opportunities
  const { data: rejectedOpportunities = [], isLoading: isLoadingRejected } = useQuery({
    queryKey: queryKeys.opportunities.rejected,
    queryFn: async () => {
      const response = await fetch('/api/opportunities/rejected', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch rejected opportunities');
      }

      const data = await response.json();
      return data.items;
    },
  });

  // Update stats calculation
  const calculatedStats: Stats = {
    total: statsData?.total || 0,
    pending: statsData?.pending || 0,
    approved: statsData?.approved || 0,
    rejected: rejectedOpportunities.length,
    avgValue: statsData?.avgValue || 0,
    byType: statsData?.byType || { bank: 0, credit_card: 0, brokerage: 0 },
    highValue: statsData?.highValue || 0,
    processingRate: statsData?.processingRate || 0,
  };

  // Fetch all approved opportunities
  const { data: approvedOpportunities = [] } = useQuery({
    queryKey: queryKeys.opportunities.approved,
    queryFn: async () => {
      const params = new URLSearchParams({
        status: 'approved',
        pageSize: '1000', // Large enough to get all approved opportunities
      });

      const response = await fetch(`/api/opportunities?${params}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.details || error.error || 'Failed to fetch approved opportunities'
        );
      }
      const data = await response.json();
      return data.items as Opportunity[];
    },
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });

  // Add error handling for mutations
  const handleMutationError = (error: unknown) => {
    console.error('Mutation error:', error);
    if (error instanceof Error) {
      // You can add toast notification or other error handling here
      console.error(error.message);
    }
  };

  // Update mutations with loading states
  const importOpportunitiesMutation = useMutation({
    mutationFn: async () => {
      setLoadingStates((prev) => ({ ...prev, import: true }));
      try {
        const bankRewardsResponse = await fetchBankRewardsOffers();
        const transformedOffers = bankRewardsResponse.data.offers.map(
          transformBankRewardsOffer
        );

        // Import opportunities
        const importResponse = await fetch('/api/opportunities/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ offers: transformedOffers }),
          credentials: 'include',
        });

        if (!importResponse.ok) {
          const error = await importResponse.json();
          throw new Error(
            error.details || error.error || 'Failed to import opportunities'
          );
        }

        return importResponse.json();
      } finally {
        setLoadingStates((prev) => ({ ...prev, import: false }));
      }
    },
    onError: handleMutationError,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.staged });
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.stats });
    },
  });

  // Approve mutation with optimistic updates
  const approveOpportunityMutation = useMutation({
    mutationFn: async (opportunity: Opportunity) => {
      setLoadingStates((prev) => ({ ...prev, [opportunity.id]: true }));
      try {
        const response = await fetch('/api/opportunities/approve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(opportunity),
          credentials: 'include',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            error.details || error.error || 'Failed to approve opportunity'
          );
        }

        return response.json();
      } finally {
        setLoadingStates((prev) => ({ ...prev, [opportunity.id]: false }));
      }
    },
    onMutate: async (opportunity) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: queryKeys.opportunities.all }),
        queryClient.cancelQueries({ queryKey: queryKeys.opportunities.staged }),
      ]);

      const previousPaginated = queryClient.getQueryData(
        queryKeys.opportunities.paginated(pagination)
      );

      // Optimistic update
      if (previousPaginated) {
        queryClient.setQueryData(queryKeys.opportunities.paginated(pagination), {
          ...previousPaginated,
          items: (previousPaginated as { items: Opportunity[] }).items.map(
            (opp: Opportunity) =>
              opp.id === opportunity.id ? { ...opp, status: 'approved' } : opp
          ),
        });
      }

      return { previousPaginated };
    },
    onError: (err, _, context) => {
      if (context?.previousPaginated) {
        queryClient.setQueryData(
          queryKeys.opportunities.paginated(pagination),
          context.previousPaginated
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.staged });
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.approved });
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.stats });
    },
  });

  // Reject mutation with optimistic updates
  const rejectOpportunityMutation = useMutation({
    mutationFn: async (opportunity: Opportunity & { isStaged?: boolean }) => {
      setLoadingStates((prev) => ({ ...prev, [opportunity.id]: true }));
      try {
        const response = await fetch(
          `/api/opportunities/${opportunity.id}?action=reject`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.details || error.error || 'Failed to reject opportunity');
        }

        return response.json();
      } finally {
        setLoadingStates((prev) => ({ ...prev, [opportunity.id]: false }));
      }
    },
    onMutate: async (opportunity) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: queryKeys.opportunities.all }),
        queryClient.cancelQueries({ queryKey: queryKeys.opportunities.staged }),
        queryClient.cancelQueries({ queryKey: queryKeys.opportunities.rejected }),
      ]);

      const previousPaginated = queryClient.getQueryData(
        queryKeys.opportunities.paginated(pagination)
      );

      // Optimistic update
      if (previousPaginated) {
        queryClient.setQueryData(queryKeys.opportunities.paginated(pagination), {
          ...previousPaginated,
          items: (previousPaginated as { items: Opportunity[] }).items.map(
            (opp: Opportunity) =>
              opp.id === opportunity.id ? { ...opp, status: 'rejected' } : opp
          ),
        });
      }

      return { previousPaginated };
    },
    onError: (err, _, context) => {
      if (context?.previousPaginated) {
        queryClient.setQueryData(
          queryKeys.opportunities.paginated(pagination),
          context.previousPaginated
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.staged });
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.rejected });
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.stats });
    },
  });

  // Bulk approve mutation with optimistic updates
  const bulkApproveOpportunitiesMutation = useMutation({
    mutationFn: async () => {
      setLoadingStates((prev) => ({ ...prev, bulkApprove: true }));
      try {
        const response = await fetch('/api/opportunities/approve/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to bulk approve opportunities');
        }

        return response.json();
      } finally {
        setLoadingStates((prev) => ({ ...prev, bulkApprove: false }));
      }
    },
    onMutate: async () => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: queryKeys.opportunities.all }),
        queryClient.cancelQueries({ queryKey: queryKeys.opportunities.staged }),
      ]);

      const previousPaginated = queryClient.getQueryData(
        queryKeys.opportunities.paginated(pagination)
      );

      if (previousPaginated) {
        queryClient.setQueryData(queryKeys.opportunities.paginated(pagination), {
          ...previousPaginated,
          items: (previousPaginated as { items: Opportunity[] }).items.map(
            (opp: Opportunity) =>
              opp.status === 'pending' ? { ...opp, status: 'approved' } : opp
          ),
        });
      }

      return { previousPaginated };
    },
    onError: (err, _, context) => {
      if (context?.previousPaginated) {
        queryClient.setQueryData(
          queryKeys.opportunities.paginated(pagination),
          context.previousPaginated
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.staged });
    },
  });

  // Reset staged offers mutation
  const resetStagedOffersMutation = useMutation({
    mutationFn: async () => {
      setLoadingStates((prev) => ({ ...prev, resetStagedOffers: true }));
      try {
        const response = await fetch('/api/opportunities/reset', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ collection: 'staged_offers' }),
          credentials: 'include',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            error.details || error.error || 'Failed to reset staged offers'
          );
        }

        return response.json();
      } finally {
        setLoadingStates((prev) => ({ ...prev, resetStagedOffers: false }));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.staged });
    },
  });

  // Reset all opportunities mutation
  const resetOpportunitiesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/opportunities/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ collection: 'opportunities' }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Failed to reset opportunities');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.approved });
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.stats });
    },
  });

  const isLoading =
    isLoadingPaginated || isLoadingStaged || isLoadingStats || isLoadingRejected;

  return {
    pagination,
    setPagination,
    stats: calculatedStats,
    stagedOpportunities,
    approvedOpportunities,
    rejectedOpportunities,
    isLoading,
    isFetching: isLoading,
    error: paginatedError || stagedError,
    approveOpportunity: approveOpportunityMutation.mutate,
    rejectOpportunity: rejectOpportunityMutation.mutate,
    bulkApproveOpportunities: bulkApproveOpportunitiesMutation.mutate,
    isBulkApproving: bulkApproveOpportunitiesMutation.isPending,
    importOpportunities: importOpportunitiesMutation.mutate,
    isImporting: importOpportunitiesMutation.isPending,
    hasStagedOpportunities: stagedOpportunities.length > 0,
    resetStagedOffers: resetStagedOffersMutation.mutate,
    isResettingStagedOffers: resetStagedOffersMutation.isPending,
    resetOpportunities: resetOpportunitiesMutation.mutate,
    isResettingOpportunities: resetOpportunitiesMutation.isPending,
    queryClient,
    loadingStates,
  };
}

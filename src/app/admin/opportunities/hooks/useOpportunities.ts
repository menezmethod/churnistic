import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { useState } from 'react';

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

const fetchPaginatedOpportunities = async (
  pagination: PaginationState
): Promise<{
  items: Opportunity[];
  total: number;
  hasMore: boolean;
  approved: number;
  rejected: number;
  avgValue: number;
  byType: {
    bank: number;
    credit_card: number;
    brokerage: number;
  };
  highValue: number;
}> => {
  const { page, pageSize, sortBy, sortDirection, filters } = pagination;

  // Construct URL with query parameters
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    sortBy: sortBy,
    sortDirection: sortDirection,
    ...(filters.status && { status: filters.status }),
    ...(filters.type && { type: filters.type }),
    ...(filters.minValue && { minValue: filters.minValue.toString() }),
    ...(filters.maxValue && { maxValue: filters.maxValue.toString() }),
    ...(filters.search && { search: filters.search }),
  });

  const response = await fetch(`/api/opportunities?${params}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch opportunities');
  }

  const data = await response.json();
  return {
    items: data.opportunities || [],
    total: data.total || 0,
    hasMore: data.hasMore || false,
    approved: data.approved || 0,
    rejected: data.rejected || 0,
    avgValue: data.avgValue || 0,
    byType: {
      bank: data.byType?.bank || 0,
      credit_card: data.byType?.credit_card || 0,
      brokerage: data.byType?.brokerage || 0,
    },
    highValue: data.highValue || 0,
  };
};

const fetchStagedOpportunities = async (): Promise<
  (Opportunity & { isStaged: boolean })[]
> => {
  const auth = getAuth();
  const idToken = await auth.currentUser?.getIdToken(true);

  if (!idToken) {
    throw new Error('No authenticated user found');
  }

  const response = await fetch('/api/opportunities/staged', {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
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

// Define the QueryKeys type first
type QueryKeys = {
  opportunities: {
    all: readonly ['opportunities'];
    paginated: (
      pagination: PaginationState
    ) => readonly ['opportunities', 'paginated', PaginationState];
    stats: readonly ['opportunities', 'stats'];
    staged: readonly ['opportunities', 'staged'];
  };
  bankRewards: {
    all: readonly ['bankRewardsOffers'];
  };
};

const queryKeys: QueryKeys = {
  opportunities: {
    all: ['opportunities'] as const,
    paginated: (pagination: PaginationState) =>
      ['opportunities', 'paginated', pagination] as const,
    stats: ['opportunities', 'stats'] as const,
    staged: ['opportunities', 'staged'] as const,
  },
  bankRewards: {
    all: ['bankRewardsOffers'] as const,
  },
};

export function useOpportunities() {
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: ITEMS_PER_PAGE,
    sortBy: 'value',
    sortDirection: 'desc',
    filters: {},
  });

  // Fetch staged opportunities with proper query key and configuration
  const { data: stagedOpportunities = [] } = useQuery({
    queryKey: queryKeys.opportunities.staged,
    queryFn: fetchStagedOpportunities,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Fetch paginated opportunities with proper query key and configuration
  const {
    data: paginatedData,
    error: paginationError,
    status: paginationStatus,
    isPending: isPaginationPending,
  } = useQuery({
    queryKey: queryKeys.opportunities.paginated(pagination),
    queryFn: () => fetchPaginatedOpportunities(pagination),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: process.env.NODE_ENV === 'development',
    refetchOnReconnect: true,
    refetchOnMount: true,
  });

  // Add stats query
  const { data: statsData } = useQuery({
    queryKey: queryKeys.opportunities.stats,
    queryFn: async () => {
      const response = await fetch('/api/opportunities/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    staleTime: 1000 * 30,
  });

  // Update stats calculation
  const calculatedStats: Stats = {
    total: statsData?.total || 0,
    pending: statsData?.pending || 0,
    approved: statsData?.approved || 0,
    rejected: 0, // Remove if not used
    avgValue: statsData?.avgValue || 0,
    byType: statsData?.byType || { bank: 0, credit_card: 0, brokerage: 0 },
    highValue: statsData?.highValue || 0,
    processingRate: `${Math.round(
      (statsData?.approved / Math.max(statsData?.total, 1)) * 100
    )}%`,
    bankRewards: undefined,
  };

  // Import mutation with proper invalidation
  const importMutation = useMutation({
    mutationFn: async () => {
      try {
        // Get Firebase auth instance for token
        const auth = getAuth();
        const user = await new Promise<User>((resolve, reject) => {
          if (auth.currentUser) {
            resolve(auth.currentUser);
            return;
          }

          const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
              unsubscribe();
              resolve(user);
            }
          });

          setTimeout(() => {
            unsubscribe();
            reject(new Error('Auth state timeout - please sign in again'));
          }, 5000);
        });

        const idToken = await user.getIdToken(true);

        // Fetch offers
        const response = await fetchBankRewardsOffers();
        const newOffers = response.data.offers.map(transformBankRewardsOffer);

        // Send import request
        const importResponse = await fetch('/api/opportunities/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            offers: newOffers,
            auth: {
              uid: user.uid,
              email: user.email || '',
              token: idToken,
            },
          }),
          credentials: 'include',
        });

        if (!importResponse.ok) {
          const error = await importResponse.json();
          throw new Error(
            error.details || error.error || `Import failed: ${importResponse.statusText}`
          );
        }

        const result = await importResponse.json();
        return result.addedCount;
      } catch (error) {
        console.error('Import error:', error);
        if (error instanceof Error) {
          if (error.message.includes('auth') || error.message.includes('sign in')) {
            throw new Error(
              `Authentication error: ${error.message}. Please sign in again.`
            );
          }
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all });
    },
  });

  // Approve mutation with optimistic updates
  const approveOpportunityMutation = useMutation({
    mutationFn: async (opportunity: Opportunity) => {
      const auth = getAuth();
      const idToken = await auth.currentUser?.getIdToken(true);

      if (!idToken) {
        throw new Error('No authenticated user found');
      }

      const response = await fetch('/api/opportunities/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(opportunity),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Failed to approve opportunity');
      }

      return response.json();
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
    },
  });

  // Reject mutation with optimistic updates
  const rejectOpportunityMutation = useMutation({
    mutationFn: async (opportunity: Opportunity & { isStaged?: boolean }) => {
      const auth = getAuth();
      const idToken = await auth.currentUser?.getIdToken(true);

      if (!idToken) {
        throw new Error('No authenticated user found');
      }

      const response = await fetch(`/api/opportunities/${opportunity.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to reject opportunity');
      }

      return opportunity.id;
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
    },
  });

  // Bulk approve mutation with optimistic updates
  const bulkApproveOpportunitiesMutation = useMutation({
    mutationFn: async () => {
      const auth = getAuth();
      const idToken = await auth.currentUser?.getIdToken(true);

      if (!idToken) {
        throw new Error('No authenticated user found');
      }

      const response = await fetch('/api/opportunities/approve/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to bulk approve opportunities');
      }

      return response.json();
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
      const auth = getAuth();
      const idToken = await auth.currentUser?.getIdToken(true);

      if (!idToken) {
        throw new Error('No authenticated user found');
      }

      const response = await fetch('/api/opportunities/staged/reset', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to reset staged offers');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.staged });
    },
  });

  // Reset all opportunities mutation
  const resetOpportunitiesMutation = useMutation({
    mutationFn: async () => {
      const auth = getAuth();
      const idToken = await auth.currentUser?.getIdToken(true);

      if (!idToken) {
        throw new Error('No authenticated user found');
      }

      const response = await fetch('/api/opportunities/reset', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to reset opportunities');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all });
    },
  });

  return {
    opportunities: [...stagedOpportunities, ...(paginatedData?.items || [])],
    total: paginatedData?.total || 0,
    hasMore: paginatedData?.hasMore || false,
    isLoading: isPaginationPending,
    error: paginationStatus === 'error' ? paginationError : null,
    refetch: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportunities.paginated(pagination),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportunities.staged,
      });
    },
    isCreating: importMutation.isPending,
    isUpdating: approveOpportunityMutation.isPending,
    isDeleting: rejectOpportunityMutation.isPending,
    createError: importMutation.error,
    updateError: approveOpportunityMutation.error,
    deleteError: rejectOpportunityMutation.error,
    approveOpportunity: approveOpportunityMutation.mutate,
    rejectOpportunity: rejectOpportunityMutation.mutate,
    bulkApproveOpportunities: bulkApproveOpportunitiesMutation.mutate,
    isBulkApproving: bulkApproveOpportunitiesMutation.isPending,
    stats: calculatedStats,
    importOpportunities: importMutation.mutate,
    hasStagedOpportunities: stagedOpportunities.length > 0,
    resetStagedOffers: resetStagedOffersMutation.mutate,
    isResettingStagedOffers: resetStagedOffersMutation.isPending,
    resetOpportunities: resetOpportunitiesMutation.mutate,
    isResettingOpportunities: resetOpportunitiesMutation.isPending,
    pagination,
    setPagination: (updates: Partial<PaginationState>) => {
      setPagination((prev) => ({ ...prev, ...updates }));
    },
  };
}

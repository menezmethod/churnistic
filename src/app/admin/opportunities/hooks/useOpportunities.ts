import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  writeBatch,
  query,
  where,
  deleteDoc,
} from 'firebase/firestore';
import { useState } from 'react';

import { db } from '@/lib/firebase/config';

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

const ITEMS_PER_PAGE = 20;

// Update the interfaces to match Opportunity type
interface RequirementDetails {
  amount: number;
  period: number;
  count?: number; // Add optional count property
}

interface BaseRequirement {
  type: string;
  details: RequirementDetails;
  minimum_deposit?: number | null;
}

interface DebitTransactionRequirement extends BaseRequirement {
  type: 'debit_transactions';
  details: { amount: number; period: number; count: number };
}

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
      // Add timeout for production environment
      signal: AbortSignal.timeout(process.env.NODE_ENV === 'production' ? 10000 : 30000),
    });
    if (!response.ok)
      throw new Error(`BankRewards API failed with status ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('BankRewards API error:', error);
    // Return empty data to prevent UI blockage
    return { data: { offers: [], stats: { total: 0, active: 0, expired: 0 } } };
  }
};

const fetchPaginatedOpportunities = async (
  pagination: PaginationState
): Promise<{
  items: Opportunity[];
  total: number;
  hasMore: boolean;
}> => {
  console.log('Fetching paginated opportunities:', pagination);
  const { page, pageSize, sortBy, sortDirection, filters } = pagination;

  // Get both collections
  const opportunitiesRef = collection(db, 'opportunities');
  const stagedOffersRef = collection(db, 'staged_offers');

  // Build base queries for both collections
  let opportunitiesQuery = query(opportunitiesRef);
  let stagedQuery = query(stagedOffersRef);

  // Apply filters to both queries
  if (filters.status) {
    opportunitiesQuery = query(opportunitiesQuery, where('status', '==', filters.status));
    stagedQuery = query(stagedQuery, where('status', '==', filters.status));
  }
  if (filters.type) {
    opportunitiesQuery = query(opportunitiesQuery, where('type', '==', filters.type));
    stagedQuery = query(stagedQuery, where('type', '==', filters.type));
  }
  if (filters.minValue) {
    opportunitiesQuery = query(
      opportunitiesQuery,
      where('value', '>=', filters.minValue)
    );
    stagedQuery = query(stagedQuery, where('value', '>=', filters.minValue));
  }
  if (filters.maxValue) {
    opportunitiesQuery = query(
      opportunitiesQuery,
      where('value', '<=', filters.maxValue)
    );
    stagedQuery = query(stagedQuery, where('value', '<=', filters.maxValue));
  }

  // Get all documents from both collections
  const [opportunitiesSnapshot, stagedSnapshot] = await Promise.all([
    getDocs(opportunitiesQuery),
    getDocs(stagedQuery),
  ]);

  console.log('Fetched snapshots:', {
    opportunities: {
      size: opportunitiesSnapshot.size,
      empty: opportunitiesSnapshot.empty,
    },
    staged: {
      size: stagedSnapshot.size,
      empty: stagedSnapshot.empty,
    },
  });

  // Combine and transform all documents
  const allOpportunities = [
    ...opportunitiesSnapshot.docs.map((doc) => {
      const data = doc.data() as Opportunity;
      return {
        ...data,
        isStaged: false,
        status: data.status || 'pending',
      };
    }),
    ...stagedSnapshot.docs.map((doc) => {
      const data = doc.data() as Opportunity;
      return {
        ...data,
        status: 'staged' as const,
        isStaged: true,
      };
    }),
  ];

  console.log('Combined opportunities:', {
    total: allOpportunities.length,
    staged: allOpportunities.filter((opp) => opp.isStaged).length,
    regular: allOpportunities.filter((opp) => !opp.isStaged).length,
  });

  // Sort combined results
  const sortedOpportunities = allOpportunities.sort((a, b) => {
    const aValue = a[sortBy as keyof Opportunity];
    const bValue = b[sortBy as keyof Opportunity];
    const modifier = sortDirection === 'asc' ? 1 : -1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return aValue.localeCompare(bValue) * modifier;
    }
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return (aValue - bValue) * modifier;
    }
    return 0;
  });

  // Calculate pagination
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = sortedOpportunities.slice(startIndex, endIndex);

  console.log('Pagination results:', {
    startIndex,
    endIndex,
    pageSize,
    totalItems: sortedOpportunities.length,
    returnedItems: paginatedItems.length,
  });

  return {
    items: paginatedItems,
    total: allOpportunities.length,
    hasMore: endIndex < allOpportunities.length,
  };
};

const fetchStagedOpportunities = async (): Promise<
  (Opportunity & { isStaged: boolean })[]
> => {
  console.log('Fetching staged opportunities...');
  try {
    const response = await fetch('/api/opportunities/staged');
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to fetch staged opportunities:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error('Failed to fetch staged opportunities');
    }
    const data = await response.json();
    console.log('Staged opportunities response:', {
      success: data.success,
      count: data.opportunities?.length,
      sample: data.opportunities?.[0]
        ? {
            id: data.opportunities[0].id,
            name: data.opportunities[0].name,
            type: data.opportunities[0].type,
          }
        : null,
    });
    return data.opportunities.map((doc: Omit<Opportunity, 'status' | 'isStaged'>) => ({
      ...doc,
      status: 'staged' as const,
      isStaged: true,
    }));
  } catch (error) {
    console.error('Error fetching staged opportunities:', error);
    throw error;
  }
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

// Then define the queryKeys constant with its type
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
} as const;

// Update Stats type to be more precise
type Stats = {
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
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
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

  // Fetch and sync BankRewards offers with stats
  const { data: bankRewardsData } = useQuery({
    queryKey: queryKeys.bankRewards.all,
    queryFn: fetchBankRewardsOffers,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });

  // Fetch stats with proper query key and real-time updates
  const { data: stats } = useQuery({
    queryKey: queryKeys.opportunities.stats,
    queryFn: async () => {
      // Get all opportunities and staged offers
      const [opportunitiesSnapshot, stagedSnapshot] = await Promise.all([
        getDocs(collection(db, 'opportunities')),
        getDocs(collection(db, 'staged_offers')),
      ]);

      // Calculate base stats
      const opportunities = opportunitiesSnapshot.docs.map(
        (doc) => doc.data() as Opportunity
      );
      const stagedOffers = stagedSnapshot.docs.map((doc) => doc.data() as Opportunity);

      // Calculate approved opportunities stats
      const approvedOpportunities = opportunities.filter(
        (opp) => opp.status === 'approved'
      );
      const totalApproved = approvedOpportunities.length;
      const totalRejected = opportunities.filter(
        (opp) => opp.status === 'rejected'
      ).length;
      const totalPending = stagedOffers.length;

      // Calculate average bonus value from approved opportunities
      const totalValue = approvedOpportunities.reduce(
        (sum, opp) => sum + (opp.value || 0),
        0
      );
      const avgValue = totalApproved > 0 ? Math.round(totalValue / totalApproved) : 0;

      // Calculate type distribution (only count approved opportunities)
      const byType = {
        bank: approvedOpportunities.filter((opp) => opp.type === 'bank').length,
        credit_card: approvedOpportunities.filter((opp) => opp.type === 'credit_card')
          .length,
        brokerage: approvedOpportunities.filter((opp) => opp.type === 'brokerage').length,
      };

      // Calculate high value opportunities (approved opportunities over $500)
      const highValue = approvedOpportunities.filter(
        (opp) => (opp.value || 0) >= 500
      ).length;

      // Calculate processing rate based on BankRewards total
      const bankRewardsTotal = bankRewardsData?.data?.stats?.total || 0;
      const processedTotal = totalApproved + totalRejected;
      const processingRate =
        bankRewardsTotal > 0
          ? ((processedTotal / bankRewardsTotal) * 100).toFixed(1)
          : '0';

      return {
        total: bankRewardsTotal, // Use BankRewards total as source of truth
        pending: totalPending,
        approved: totalApproved,
        rejected: totalRejected,
        avgValue,
        highValue,
        byType,
        bankRewards: bankRewardsData?.data?.stats
          ? {
              total: bankRewardsTotal,
              active: bankRewardsData.data.stats.active || 0,
              expired: bankRewardsData.data.stats.expired || 0,
            }
          : undefined,
        processingRate: `${processingRate}%`,
      };
    },
    staleTime: 1000 * 15, // 15 seconds - shorter stale time for stats
    gcTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 1000 * 30, // Refetch every 30 seconds
  });

  // Optimistic update helper
  const updateStatsOptimistically = (
    action: 'approve' | 'reject',
    opportunity: Opportunity
  ) => {
    queryClient.setQueryData<Stats>(
      queryKeys.opportunities.stats,
      (oldStats: Stats | undefined) => {
        if (!oldStats) return oldStats;

        const newPending = Math.max(0, oldStats.pending - 1);
        const newApproved =
          action === 'approve' ? oldStats.approved + 1 : oldStats.approved;
        const newRejected =
          action === 'reject' ? oldStats.rejected + 1 : oldStats.rejected;

        return {
          ...oldStats,
          total: oldStats.total,
          pending: newPending,
          approved: newApproved,
          rejected: newRejected,
          byType: {
            ...oldStats.byType,
            [opportunity.type]: Math.max(0, oldStats.byType[opportunity.type]),
          },
        };
      }
    );
  };

  // Import mutation with proper invalidation
  const importMutation = useMutation({
    mutationFn: async () => {
      try {
        // Get Firebase auth instance
        const auth = getAuth();

        // Wait for auth state to be ready using Promise with proper typing
        const user = await new Promise<User>((resolve, reject) => {
          // Check if already signed in
          if (auth.currentUser) {
            resolve(auth.currentUser);
            return;
          }

          // Set up auth state listener with timeout
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
              unsubscribe();
              resolve(user);
            }
          });

          // Timeout after 5 seconds
          setTimeout(() => {
            unsubscribe();
            reject(new Error('Auth state timeout - please sign in again'));
          }, 5000);
        });

        // Get fresh ID token with force refresh
        const idToken = await user.getIdToken(true);

        // Log auth state (redacted for security)
        console.log('Auth state:', {
          isAuthenticated: true,
          email: user.email,
          emailVerified: user.emailVerified,
          isEmulator: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true',
        });

        // Prepare headers with auth token
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        };

        // Add emulator specific headers if using emulators
        if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
          console.log('Using Firebase emulators');
          headers['X-Firebase-AppCheck-Debug-Token'] = 'debug-token';
        }

        // Fetch offers
        console.log('Fetching BankRewards offers...');
        const response = await fetchBankRewardsOffers();
        const newOffers = response.data.offers.map(transformBankRewardsOffer);
        console.log(`Transformed ${newOffers.length} offers`);

        // Send import request with auth token
        const importResponse = await fetch('/api/opportunities/import', {
          method: 'POST',
          headers,
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
          console.error('Import error:', {
            status: importResponse.status,
            statusText: importResponse.statusText,
            error,
          });
          throw new Error(
            error.details || error.error || `Import failed: ${importResponse.statusText}`
          );
        }

        const result = await importResponse.json();
        console.log('Import successful:', result);

        return result.addedCount;
      } catch (error) {
        console.error('Import error:', error);
        // Enhance error message for auth-related errors
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
    onSuccess: (count) => {
      console.log(`Successfully imported ${count} offers`);
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportunities.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportunities.stats,
      });
    },
    onError: (error: Error) => {
      console.error('Import mutation error:', error);
    },
    retry: (failureCount, error) => {
      // Only retry if it's not an auth error
      if (
        error instanceof Error &&
        (error.message.includes('auth') || error.message.includes('sign in'))
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Approve mutation with optimistic updates
  const approveOpportunityMutation = useMutation({
    mutationFn: async (opportunityData: Opportunity) => {
      try {
        // Get Firebase auth instance
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          throw new Error('No authenticated user found');
        }

        // Get fresh ID token
        const idToken = await user.getIdToken(true);
        console.log('Got fresh ID token for approval');

        // Send to server-side API endpoint for Firebase operations
        const approveResponse = await fetch('/api/opportunities/approve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            ...opportunityData,
            user: {
              email: user.email,
              uid: user.uid,
            },
          }),
          credentials: 'include',
        });

        if (!approveResponse.ok) {
          const errorData = await approveResponse.json();
          console.error('Approval error response:', errorData);
          throw new Error(
            errorData.details || errorData.error || 'Failed to approve opportunity'
          );
        }

        // Transform to match API structure for the external API
        const formData = {
          id: opportunityData.id,
          name: opportunityData.name,
          type: opportunityData.type,
          value: opportunityData.value.toString(),
          description: opportunityData.bonus.description || '',
          offer_link: opportunityData.offer_link,
          source_id: opportunityData.source_id,
          source: opportunityData.source,
          status: 'approved',
          createdAt: opportunityData.createdAt,
          bonus: {
            title: opportunityData.bonus.title || '',
            description: opportunityData.bonus.description || '',
            requirements: {
              title: 'Bonus Requirements',
              description: opportunityData.bonus.requirements
                .map((req: BaseRequirement) => {
                  switch (req.type) {
                    case 'spending':
                      return `Spend $${req.details.amount.toLocaleString()} within ${req.details.period} days`;
                    case 'direct_deposit':
                      return `Receive direct deposits totaling $${req.details.amount.toLocaleString()} within ${req.details.period} days`;
                    case 'debit_transactions':
                      const debitReq = req as DebitTransactionRequirement;
                      return `Make ${debitReq.details.count} debit card purchases`;
                    case 'transfer':
                      return `Transfer $${req.details.amount.toLocaleString()} within ${req.details.period} days`;
                    case 'link_account':
                      return 'Link a bank account';
                    case 'minimum_deposit':
                      return `Maintain a minimum deposit of $${req.details.amount.toLocaleString()} for ${req.details.period} days`;
                    default:
                      return 'Contact bank for specific requirements';
                  }
                })
                .join(' AND '),
            },
            additional_info: opportunityData.bonus.additional_info || null,
            tiers:
              opportunityData.bonus.tiers?.map((tier) => ({
                reward: tier.reward || '',
                deposit: tier.deposit || '',
                level: tier.level || null,
                value: tier.value || null,
                minimum_deposit: tier.minimum_deposit || null,
                requirements: tier.requirements || null,
              })) || null,
          },
          details: {
            monthly_fees: opportunityData.details?.monthly_fees || {
              amount: '0',
            },
            account_type: opportunityData.details?.account_type || '',
            availability: opportunityData.details?.availability || {
              type: 'Nationwide',
              states: [],
            },
            credit_inquiry: opportunityData.details?.credit_inquiry || null,
            household_limit: opportunityData.details?.household_limit || null,
            early_closure_fee: opportunityData.details?.early_closure_fee || null,
            chex_systems: opportunityData.details?.chex_systems || null,
            expiration: opportunityData.details?.expiration || null,
            options_trading: opportunityData.details?.options_trading || null,
            ira_accounts: opportunityData.details?.ira_accounts || null,
            under_5_24:
              opportunityData.details?.under_5_24 !== undefined
                ? opportunityData.details.under_5_24
                : null,
            foreign_transaction_fees:
              opportunityData.details?.foreign_transaction_fees || null,
            annual_fees: opportunityData.details?.annual_fees || null,
          },
          logo: opportunityData.logo || {
            type: '',
            url: '',
          },
          card_image:
            opportunityData.type === 'credit_card'
              ? opportunityData.card_image || {
                  url: '',
                  network: 'Unknown',
                  color: 'Unknown',
                  badge: null,
                }
              : null,
          metadata: {
            created_at: opportunityData.createdAt || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: user.email,
            updated_by: user.email,
            status: 'active',
            environment: process.env.NODE_ENV || 'development',
          },
        };

        // Create external API endpoint entry with auth token
        const response = await fetch('/api/opportunities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify(formData),
          credentials: 'include',
        });

        if (!response.ok) {
          const responseText = await response.text();
          console.error('API Error Response Text:', responseText);

          let errorData;
          try {
            errorData = JSON.parse(responseText);
            console.error('API Error Response:', errorData);
            throw new Error(
              errorData.details ||
                errorData.error ||
                'Failed to create API endpoint entry'
            );
          } catch (parseError) {
            console.error('Error parsing API response:', parseError);
            throw new Error(
              `Failed to create API endpoint entry: ${response.statusText} - ${responseText}`
            );
          }
        }

        const apiResponse = await response.json();
        console.log('API Response:', apiResponse);

        const { opportunity: approvedOpportunity } = await approveResponse.json();
        return approvedOpportunity;
      } catch (error) {
        console.error('Error in approveOpportunityMutation:', error);
        throw error;
      }
    },
    onMutate: async (opportunityData) => {
      // Cancel outgoing refetches
      await Promise.all([
        queryClient.cancelQueries({ queryKey: queryKeys.opportunities.all }),
        queryClient.cancelQueries({ queryKey: queryKeys.opportunities.stats }),
        queryClient.cancelQueries({ queryKey: queryKeys.opportunities.staged }),
      ]);

      // Snapshot current state
      const previousStats = queryClient.getQueryData(queryKeys.opportunities.stats);
      const previousPaginated = queryClient.getQueryData(
        queryKeys.opportunities.paginated(pagination)
      );

      // Optimistically update stats
      updateStatsOptimistically('approve', opportunityData);

      // Return context for rollback
      return { previousStats, previousPaginated };
    },
    onError: (err, _, context) => {
      // Rollback on error
      if (context?.previousStats) {
        queryClient.setQueryData(queryKeys.opportunities.stats, context.previousStats);
      }
      if (context?.previousPaginated) {
        queryClient.setQueryData(
          queryKeys.opportunities.paginated(pagination),
          context.previousPaginated
        );
      }
    },
    onSettled: () => {
      // Invalidate affected queries
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.staged });
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportunities.paginated(pagination),
      });
    },
  });

  // Reject mutation with optimistic updates
  const rejectOpportunityMutation = useMutation({
    mutationFn: async (opportunityData: Opportunity & { isStaged?: boolean }) => {
      if (opportunityData.isStaged) {
        // Just remove from staged_offers
        await deleteDoc(doc(db, 'staged_offers', opportunityData.id));
        return null;
      } else {
        // Update existing opportunity
        const opportunityRef = doc(db, 'opportunities', opportunityData.id);
        await updateDoc(opportunityRef, {
          status: 'rejected',
          updatedAt: new Date().toISOString(),
        });
        return opportunityData.id;
      }
    },
    onMutate: async (opportunityData) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: queryKeys.opportunities.all }),
        queryClient.cancelQueries({ queryKey: queryKeys.opportunities.stats }),
        queryClient.cancelQueries({ queryKey: queryKeys.opportunities.staged }),
      ]);

      const previousStats = queryClient.getQueryData(queryKeys.opportunities.stats);
      const previousPaginated = queryClient.getQueryData(
        queryKeys.opportunities.paginated(pagination)
      );

      updateStatsOptimistically('reject', opportunityData);

      return { previousStats, previousPaginated };
    },
    onError: (err, _, context) => {
      if (context?.previousStats) {
        queryClient.setQueryData(queryKeys.opportunities.stats, context.previousStats);
      }
      if (context?.previousPaginated) {
        queryClient.setQueryData(
          queryKeys.opportunities.paginated(pagination),
          context.previousPaginated
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.staged });
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportunities.paginated(pagination),
      });
    },
  });

  // Bulk approve mutation with optimistic updates
  const bulkApproveOpportunitiesMutation = useMutation({
    mutationFn: async () => {
      console.log('Starting bulk approval process for all staged offers');

      // Get all staged offers first
      const stagedSnapshot = await getDocs(collection(db, 'staged_offers'));
      const allStagedOpportunities = stagedSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Opportunity[];

      console.log(
        `Found ${allStagedOpportunities.length} staged opportunities to approve`
      );

      const results: string[] = [];
      const errors: Array<{ id: string; error: unknown }> = [];

      // Process in larger batches for better performance
      const batchSize = 25; // Increased from 10 to 25
      const batches = [];

      // Create batches of opportunities
      for (let i = 0; i < allStagedOpportunities.length; i += batchSize) {
        batches.push(allStagedOpportunities.slice(i, i + batchSize));
      }

      // Process batches sequentially to maintain order and prevent overwhelming
      for (const [index, batch] of batches.entries()) {
        console.log(`Processing batch ${index + 1} of ${batches.length}`);

        // Create a new batch write
        const batchWriter = writeBatch(db);

        // Add all operations to the batch
        for (const opportunity of batch) {
          const stagedRef = doc(db, 'staged_offers', opportunity.id);
          const approvedRef = doc(db, 'opportunities', opportunity.id);

          // Delete from staged_offers and add to opportunities
          batchWriter.delete(stagedRef);
          batchWriter.set(approvedRef, {
            ...opportunity,
            status: 'approved',
            updatedAt: new Date().toISOString(),
          });
        }

        try {
          // Commit the batch
          await batchWriter.commit();
          results.push(...batch.map((opp) => opp.id));
          console.log(`Successfully processed batch ${index + 1}`);
        } catch (error) {
          console.error(`Error processing batch ${index + 1}:`, error);
          errors.push(...batch.map((opp) => ({ id: opp.id, error })));
        }
      }

      return {
        successful: results,
        failed: errors,
        total: allStagedOpportunities.length,
      };
    },
    onMutate: async () => {
      // Cancel outgoing queries
      await Promise.all([
        queryClient.cancelQueries({ queryKey: queryKeys.opportunities.all }),
        queryClient.cancelQueries({ queryKey: queryKeys.opportunities.stats }),
        queryClient.cancelQueries({ queryKey: queryKeys.opportunities.staged }),
      ]);

      // Snapshot current state
      const previousStats = queryClient.getQueryData<Stats>(
        queryKeys.opportunities.stats
      );
      const previousPaginated = queryClient.getQueryData(
        queryKeys.opportunities.paginated(pagination)
      );

      // Optimistically update stats
      if (previousStats) {
        queryClient.setQueryData<Stats>(queryKeys.opportunities.stats, {
          ...previousStats,
          pending: 0,
          approved: previousStats.approved + previousStats.pending,
          processingRate: previousStats.bankRewards?.total
            ? `${(((previousStats.approved + previousStats.pending) / previousStats.bankRewards.total) * 100).toFixed(1)}%`
            : '0%',
        });
      }

      return { previousStats, previousPaginated };
    },
    onError: (err, _, context) => {
      // Rollback on error
      if (context?.previousStats) {
        queryClient.setQueryData(queryKeys.opportunities.stats, context.previousStats);
      }
      if (context?.previousPaginated) {
        queryClient.setQueryData(
          queryKeys.opportunities.paginated(pagination),
          context.previousPaginated
        );
      }
    },
    onSettled: () => {
      // Invalidate affected queries
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities.staged });
      queryClient.invalidateQueries({
        queryKey: queryKeys.opportunities.paginated(pagination),
      });
    },
  });

  // Reset staged offers mutation
  const resetStagedOffersMutation = useMutation({
    mutationFn: async () => {
      console.log('Starting reset of staged offers');
      const stagedSnapshot = await getDocs(collection(db, 'staged_offers'));
      const batch = writeBatch(db);

      stagedSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Reset ${stagedSnapshot.size} staged offers`);
      return stagedSnapshot.size;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staged_offers'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'stats'] });
    },
  });

  // Reset all opportunities mutation
  const resetOpportunitiesMutation = useMutation({
    mutationFn: async () => {
      console.log('Starting reset of all opportunities');
      const [stagedSnapshot, opportunitiesSnapshot] = await Promise.all([
        getDocs(collection(db, 'staged_offers')),
        getDocs(collection(db, 'opportunities')),
      ]);

      const batch = writeBatch(db);

      // Delete all staged offers
      stagedSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Delete all opportunities
      opportunitiesSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(
        `Reset ${stagedSnapshot.size + opportunitiesSnapshot.size} total opportunities`
      );
      return {
        staged: stagedSnapshot.size,
        opportunities: opportunitiesSnapshot.size,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staged_offers'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'stats'] });
    },
  });

  return {
    opportunities: (paginatedData?.items || []).map((opp) => {
      console.log('Processing opportunity:', {
        id: opp.id,
        name: opp.name,
        type: opp.type,
        isStaged: opp.status === 'staged',
      });
      return {
        ...opp,
        isStaged: opp.status === 'staged',
      };
    }),
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
    stats: stats || {
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
    },
    importOpportunities: importMutation.mutate,
    hasStagedOpportunities: stagedOpportunities.length > 0,
    resetStagedOffers: resetStagedOffersMutation.mutate,
    isResettingStagedOffers: resetStagedOffersMutation.isPending,
    resetOpportunities: resetOpportunitiesMutation.mutate,
    isResettingOpportunities: resetOpportunitiesMutation.isPending,
    pagination,
    setPagination: (updates: Partial<PaginationState>) => {
      setPagination((prev: PaginationState) => ({ ...prev, ...updates }));
    },
  };
}

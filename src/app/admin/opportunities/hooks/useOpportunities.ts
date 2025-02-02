import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAuth } from 'firebase/auth';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  writeBatch,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  deleteDoc,
  setDoc,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

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
  // Use our proxy endpoint instead of calling the BankRewards API directly
  const response = await fetch('/api/opportunities/bankrewards', {
    method: 'GET',
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch from BankRewards API');
  const data = await response.json();
  return data as BankRewardsResponse;
};

const fetchPaginatedOpportunities = async (
  pagination: PaginationState
): Promise<{
  items: Opportunity[];
  total: number;
  hasMore: boolean;
}> => {
  const { page, pageSize, sortBy, sortDirection, filters } = pagination;
  const opportunitiesRef = collection(db, 'opportunities');

  // Build query with filters
  let baseQuery = query(opportunitiesRef);

  // Apply filters to both total count and paginated queries
  if (filters.status) {
    baseQuery = query(baseQuery, where('status', '==', filters.status));
  }
  if (filters.type) {
    baseQuery = query(baseQuery, where('type', '==', filters.type));
  }
  if (filters.minValue) {
    baseQuery = query(baseQuery, where('value', '>=', filters.minValue));
  }
  if (filters.maxValue) {
    baseQuery = query(baseQuery, where('value', '<=', filters.maxValue));
  }

  // Get total count with filters applied
  const totalSnapshot = await getDocs(baseQuery);
  const total = totalSnapshot.size;

  // Add sorting and pagination to the query
  let q = query(baseQuery, orderBy(sortBy, sortDirection));
  q = query(q, limit(pageSize));

  if (page > 1) {
    const lastDoc = await getDocs(query(q, limit((page - 1) * pageSize)));
    if (lastDoc.docs.length > 0) {
      q = query(q, startAfter(lastDoc.docs[lastDoc.docs.length - 1]));
    }
  }

  const snapshot = await getDocs(q);
  return {
    items: snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...doc.data(),
    })) as Opportunity[],
    total,
    hasMore: snapshot.docs.length === pageSize && snapshot.docs.length < total,
  };
};

const fetchStagedOpportunities = async (): Promise<
  (Opportunity & { isStaged: boolean })[]
> => {
  console.log('Fetching staged opportunities...');
  try {
    const response = await fetch('/api/opportunities/staged');
    if (!response.ok) {
      throw new Error('Failed to fetch staged opportunities');
    }
    const data = await response.json();
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

export function useOpportunities() {
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: ITEMS_PER_PAGE,
    sortBy: 'createdAt',
    sortDirection: 'desc',
    filters: {},
  });

  const [stats, setStats] = useState<{
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
  }>({
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
  });

  // Fetch staged opportunities
  const { data: stagedOpportunities = [] } = useQuery({
    queryKey: ['staged_offers'],
    queryFn: fetchStagedOpportunities,
  });

  // Fetch paginated opportunities
  const {
    data: paginatedData,
    error: paginationError,
    isLoading: isPaginationLoading,
  } = useQuery({
    queryKey: ['opportunities', 'paginated', pagination],
    queryFn: () => fetchPaginatedOpportunities(pagination),
    keepPreviousData: true,
  });

  // Fetch total stats with detailed metrics
  const { data: totalStats } = useQuery({
    queryKey: ['opportunities', 'stats'],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, 'opportunities'));
      const opportunities = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Opportunity[];

      const totalValue = opportunities.reduce((sum, opp) => sum + opp.value, 0);

      return {
        total: opportunities.length,
        pending: opportunities.filter((opp) => opp.status === 'pending').length,
        approved: opportunities.filter((opp) => opp.status === 'approved').length,
        rejected: opportunities.filter((opp) => opp.status === 'rejected').length,
        avgValue:
          opportunities.length > 0 ? Math.round(totalValue / opportunities.length) : 0,
        highValue: opportunities.filter((opp) => opp.value >= 500).length,
        byType: {
          bank: opportunities.filter((opp) => opp.type === 'bank').length,
          credit_card: opportunities.filter((opp) => opp.type === 'credit_card').length,
          brokerage: opportunities.filter((opp) => opp.type === 'brokerage').length,
        },
      };
    },
  });

  // Fetch and sync BankRewards offers
  useQuery({
    queryKey: ['bankRewardsOffers'],
    queryFn: fetchBankRewardsOffers,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Import mutation to stage opportunities
  const importMutation = useMutation({
    mutationFn: async () => {
      console.log('Starting import process');
      const response = await fetchBankRewardsOffers();
      console.log('Fetched offers:', response.data.offers.length);

      // Transform offers
      const newOffers = response.data.offers.map(transformBankRewardsOffer);
      console.log('Transformed offers:', newOffers.length);

      // Send to API endpoint
      const importResponse = await fetch('/api/opportunities/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ offers: newOffers }),
        credentials: 'include', // Include credentials for authentication
      });

      if (!importResponse.ok) {
        const error = await importResponse.json();
        console.error('Import error:', error);
        throw new Error(error.details || error.error || 'Failed to import opportunities');
      }

      const result = await importResponse.json();
      console.log('Import result:', result);

      return result.addedCount;
    },
    onSuccess: (count) => {
      console.log(`Import completed successfully. Added ${count} new offers.`);
      queryClient.invalidateQueries(['staged_offers']);
      queryClient.invalidateQueries(['opportunities', 'stats']);
    },
    onError: (error: Error) => {
      console.error('Import error:', error);
      // You can handle the error here, e.g., show a toast notification
    },
  });

  // Approve mutation
  const approveOpportunityMutation = useMutation({
    mutationFn: async (opportunityData: Opportunity) => {
      try {
        // Get user first to ensure we have authentication
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user?.email) {
          throw new Error('No authenticated user found');
        }

        // First, add to opportunities collection to ensure the ID exists
        const approvedOpportunity = {
          ...opportunityData,
          status: 'approved' as const,
          updatedAt: new Date().toISOString(),
          metadata: {
            ...(opportunityData.metadata || {}),
            created_by: user.email,
            updated_by: user.email,
            updated_at: new Date().toISOString(),
            status: 'active',
          },
        };

        await setDoc(doc(db, 'opportunities', opportunityData.id), approvedOpportunity);

        // Transform to match API structure
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

        console.log('Sending to API:', JSON.stringify(formData, null, 2));

        // Create API endpoint entry
        const response = await fetch('/api/opportunities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        let errorMessage = 'Failed to create API endpoint entry';
        if (!response.ok) {
          const responseText = await response.text();
          console.error('API Error Response Text:', responseText);

          let errorData;
          try {
            errorData = JSON.parse(responseText);
            console.error('API Error Response:', errorData);
            errorMessage = errorData.details || errorData.error || errorMessage;
          } catch (parseError) {
            console.error('Error parsing API response:', parseError);
            errorMessage = `${errorMessage}: ${response.statusText} - ${responseText}`;
          }
          throw new Error(errorMessage);
        }

        const apiResponse = await response.json();
        console.log('API Response:', apiResponse);

        // Remove from staged_offers collection
        await deleteDoc(doc(db, 'staged_offers', opportunityData.id));

        return approvedOpportunity;
      } catch (error) {
        console.error('Error in approveOpportunityMutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['staged_offers'] });
    },
  });

  // Reject opportunity mutation
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
    onSuccess: () => {
      queryClient.invalidateQueries(['opportunities']);
      queryClient.invalidateQueries(['staged_offers']);
    },
  });

  // Combine staged and Firebase opportunities for display
  const allOpportunities = [
    ...stagedOpportunities,
    ...(paginatedData?.items || []).map((opp) => ({
      ...opp,
      isStaged: false,
    })),
  ];

  // Update stats to include staged opportunities
  useEffect(() => {
    if (totalStats) {
      setStats({
        ...totalStats,
        total: totalStats.total + stagedOpportunities.length,
        pending: totalStats.pending + stagedOpportunities.length,
      });
    }
  }, [totalStats, stagedOpportunities]);

  const updatePagination = (updates: Partial<PaginationState>) => {
    setPagination((prev: PaginationState) => ({
      ...prev,
      ...updates,
      page: 'page' in updates ? updates.page! : 1,
    }));
  };

  // Bulk approve mutation
  const bulkApproveOpportunitiesMutation = useMutation({
    mutationFn: async (opportunities: Opportunity[]) => {
      console.log(
        'Starting bulk approval process for',
        opportunities.length,
        'opportunities'
      );
      const results: string[] = [];
      const errors: Array<{ id: string; error: unknown }> = [];

      for (const opportunity of opportunities) {
        try {
          await approveOpportunityMutation.mutateAsync(opportunity);
          results.push(opportunity.id);
        } catch (error) {
          console.error('Error approving opportunity:', opportunity.id, error);
          errors.push({ id: opportunity.id, error });
        }
      }

      return {
        successful: results,
        failed: errors,
        total: opportunities.length,
      };
    },
    onSuccess: (result: {
      successful: string[];
      failed: Array<{ id: string; error: unknown }>;
      total: number;
    }) => {
      console.log('Bulk approval completed:', result);
      queryClient.invalidateQueries(['opportunities']);
      queryClient.invalidateQueries(['staged_offers']);
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
      queryClient.invalidateQueries(['staged_offers']);
      queryClient.invalidateQueries(['opportunities', 'stats']);
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
      queryClient.invalidateQueries(['staged_offers']);
      queryClient.invalidateQueries(['opportunities']);
      queryClient.invalidateQueries(['opportunities', 'stats']);
    },
  });

  return {
    opportunities: allOpportunities,
    pagination,
    updatePagination,
    hasMore: paginatedData?.hasMore || false,
    error: paginationError ? (paginationError as Error).message : null,
    loading: isPaginationLoading,
    approveOpportunity: approveOpportunityMutation.mutate,
    rejectOpportunity: rejectOpportunityMutation.mutate,
    bulkApproveOpportunities: bulkApproveOpportunitiesMutation.mutate,
    isBulkApproving: bulkApproveOpportunitiesMutation.isLoading,
    stats,
    importOpportunities: importMutation.mutate,
    isImporting: importMutation.isLoading,
    hasStagedOpportunities: stagedOpportunities.length > 0,
    resetStagedOffers: resetStagedOffersMutation.mutate,
    isResettingStagedOffers: resetStagedOffersMutation.isLoading,
    resetOpportunities: resetOpportunitiesMutation.mutate,
    isResettingOpportunities: resetOpportunitiesMutation.isLoading,
  };
}

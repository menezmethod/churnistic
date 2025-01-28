import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';

import { db } from '@/lib/firebase/config';

import { Opportunity } from '../types/opportunity';

interface BankRewardsOffer {
  id: string;
  name: string;
  type: 'bank' | 'credit_card' | 'brokerage';
  value: number;
  bonus: {
    title: string;
    description: string;
    requirements: {
      title: string;
      description: string;
      spending_requirement?: {
        amount: number;
        timeframe: string;
      };
    };
    tiers?: {
      reward: string;
      deposit: string;
    }[];
  };
  details: {
    monthly_fees?: {
      amount: string;
      waiver_details?: string;
    };
    annual_fees?: {
      amount: string;
      waived_first_year: boolean;
    };
    account_type?: string;
    availability?: {
      type: string;
      states?: string[];
    };
    credit_inquiry?: string;
    expiration?: string;
    credit_score?: string;
    under_5_24?: string;
    foreign_transaction_fees?: {
      percentage: string;
      waived: boolean;
    };
    minimum_credit_limit?: string;
    rewards_structure?: string;
    household_limit?: string;
    early_closure_fee?: string;
    chex_systems?: string;
    options_trading?: string;
    ira_accounts?: string;
  };
  metadata: {
    created_at: string;
    updated_at: string;
    created_by: string;
    status: string;
    source?: {
      original_id: string;
    };
  };
  logo: {
    type: string;
    url: string;
  };
  card_image?: {
    url: string;
    network?: string;
    color?: string;
    badge?: string;
  };
  offer_link: string;
  description?: string;
  isNew?: boolean;
  expirationDate?: string;
}

interface BankRewardsResponse {
  data: {
    stats: {
      total: number;
      active: number;
      expired: number;
    };
    offers: BankRewardsOffer[];
  };
}

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

const transformBankRewardsOffer = (offer: BankRewardsOffer): Opportunity => {
  const bank = offer.name?.split(' ')?.[0] || offer.name || '';

  // Convert timeframe to period (days)
  const getSpendingPeriod = (timeframe: string) => {
    const match = timeframe.match(/(\d+)/);
    return match ? parseInt(match[1]) : 90; // default to 90 days
  };

  // Ensure no undefined values in details
  const details = {
    monthly_fees: offer.details.monthly_fees || {
      amount: '0',
      waiver_details: null,
    },
    annual_fees: offer.details.annual_fees?.amount || null,
    account_type: offer.details.account_type || null,
    availability: offer.details.availability || {
      type: 'Nationwide',
      states: [],
    },
    credit_inquiry: offer.details.credit_inquiry || null,
    expiration: offer.details.expiration || null,
  };

  // Ensure no undefined values in bonus
  const bonus = {
    title: offer.bonus.title || '',
    value: offer.value,
    description: offer.bonus.description || '',
    requirements: offer.bonus.requirements
      ? [
          {
            type: offer.bonus.requirements.spending_requirement ? 'spending' : 'other',
            details: offer.bonus.requirements.spending_requirement
              ? {
                  amount: offer.bonus.requirements.spending_requirement.amount,
                  period: getSpendingPeriod(
                    offer.bonus.requirements.spending_requirement.timeframe
                  ),
                }
              : {
                  amount: offer.value,
                  period: 90,
                },
          },
        ]
      : [],
    tiers:
      offer.bonus.tiers?.map((tier) => ({
        reward: tier.reward || '',
        deposit: tier.deposit || '',
      })) || [],
  };

  // Use original_id from metadata if available, otherwise use offer.id
  const source_id = offer.metadata?.source?.original_id || offer.id;

  return {
    id: source_id, // Use source_id as the document ID to prevent duplicates
    name: offer.name,
    type: offer.type,
    bank,
    value: offer.value,
    status: 'staged' as const,
    source: {
      name: 'Bank Rewards',
      collected_at: new Date().toISOString(),
    },
    source_id,
    bonus,
    details,
    logo: offer.logo || {
      type: '',
      url: '',
    },
    card_image: offer.card_image || null,
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

const fetchBankRewardsOffers = async (): Promise<BankRewardsResponse> => {
  const response = await fetch('http://localhost:3000/api/bankrewards?format=detailed');
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
    items: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Opportunity[],
    total,
    hasMore: snapshot.docs.length === pageSize && snapshot.docs.length < total,
  };
};

const fetchStagedOpportunities = async (): Promise<
  (Opportunity & { isStaged: boolean })[]
> => {
  const snapshot = await getDocs(collection(db, 'staged_offers'));
  return snapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
    status: 'staged' as const,
    isStaged: true,
  })) as (Opportunity & { isStaged: boolean })[];
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

  const [stats, setStats] = useState({
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

      const batch = writeBatch(db);

      // Transform offers
      const newOffers = response.data.offers.map(transformBankRewardsOffer);
      console.log('Transformed offers:', newOffers.length);

      // Get existing staged offers to check for duplicates
      const [stagedSnapshot, approvedSnapshot] = await Promise.all([
        getDocs(collection(db, 'staged_offers')),
        getDocs(collection(db, 'opportunities')),
      ]);

      console.log('Current staged offers:', stagedSnapshot.size);
      console.log('Current approved offers:', approvedSnapshot.size);

      // Track both staged and approved offers by source_id
      const existingSourceIds = new Set([
        ...stagedSnapshot.docs.map((doc) => doc.data().source_id),
        ...approvedSnapshot.docs.map((doc) => doc.data().source_id),
      ]);

      console.log('Existing source IDs:', existingSourceIds.size);

      let addedCount = 0;
      let skippedCount = 0;

      for (const offer of newOffers) {
        // Skip if already staged or previously approved
        if (existingSourceIds.has(offer.source_id)) {
          skippedCount++;
          continue;
        }

        // Use source_id as document ID to prevent duplicates
        const docRef = doc(collection(db, 'staged_offers'), offer.source_id);
        batch.set(docRef, offer);
        addedCount++;
      }

      console.log(`Import summary:
        Total offers: ${newOffers.length}
        Added: ${addedCount}
        Skipped: ${skippedCount}
      `);

      if (addedCount > 0) {
        await batch.commit();
        console.log('Batch commit successful');
      } else {
        console.log('No new offers to commit');
      }

      return addedCount;
    },
    onSuccess: (count) => {
      console.log(`Import completed successfully. Added ${count} new offers.`);
      queryClient.invalidateQueries(['staged_offers']);
      queryClient.invalidateQueries(['opportunities', 'stats']);
    },
    onError: (error) => {
      console.error('Import failed:', error);
    },
  });

  // Approve mutation
  const approveOpportunityMutation = useMutation({
    mutationFn: async (opportunityData: Opportunity) => {
      try {
        // First, add to opportunities collection to ensure the ID exists
        const approvedOpportunity = {
          ...opportunityData,
          status: 'approved' as const,
          updatedAt: new Date().toISOString(),
        };

        await setDoc(doc(db, 'opportunities', opportunityData.id), approvedOpportunity);

        // Transform to match API structure
        const auth = getAuth();
        const user = auth.currentUser;

        const formData = {
          id: opportunityData.id, // Ensure we use the same ID
          name: opportunityData.name,
          type: opportunityData.type,
          value: opportunityData.value.toString(), // API expects string
          description: opportunityData.bonus.description || '',
          offer_link: `/api/opportunities/${opportunityData.id}/redirect`,
          bonus: {
            title: opportunityData.bonus.title || '',
            description: opportunityData.bonus.description || '',
            requirements: opportunityData.bonus.requirements?.[0]
              ? {
                  title: 'Bonus Requirements',
                  description:
                    opportunityData.bonus.requirements[0].type === 'spending'
                      ? `Spend $${opportunityData.bonus.requirements[0].details.amount} within ${opportunityData.bonus.requirements[0].details.period} days`
                      : 'Contact bank for specific requirements',
                }
              : {
                  title: '',
                  description: '',
                },
            additional_info: null,
            tiers:
              opportunityData.bonus.tiers?.map((tier) => ({
                reward: tier.reward || '',
                deposit: tier.deposit || '',
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
            household_limit: null,
            early_closure_fee: null,
            chex_systems: null,
            expiration: opportunityData.details?.expiration || null,
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
            created_by: user?.email || 'unknown@example.com',
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
    setPagination((prev) => ({
      ...prev,
      ...updates,
      page: 'page' in updates ? updates.page! : 1,
    }));
  };

  return {
    opportunities: allOpportunities,
    pagination,
    updatePagination,
    hasMore: paginatedData?.hasMore || false,
    error: paginationError ? (paginationError as Error).message : null,
    loading: isPaginationLoading,
    approveOpportunity: approveOpportunityMutation.mutate,
    rejectOpportunity: rejectOpportunityMutation.mutate,
    stats,
    importOpportunities: importMutation.mutate,
    isImporting: importMutation.isLoading,
    hasStagedOpportunities: stagedOpportunities.length > 0,
  };
}

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
      spending_requirement?: string;
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
    annual_fees?: string;
    account_type?: string;
    availability?: {
      type: string;
      states?: string[];
    };
    credit_inquiry?: string;
    expiration?: string;
    credit_score?: string;
    under_5_24?: string;
    foreign_transaction_fees?: string;
    minimum_credit_limit?: string;
    rewards_structure?: string;
    household_limit?: string;
    early_closure_fee?: string;
    chex_systems?: string;
    options_trading?: string;
    ira_accounts?: string;
  };
  metadata: {
    created: string;
    updated: string;
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


const extractRequirements = (description: string) => {
  if (!description) return { type: 'other', details: { amount: 0, period: 0 } };

  // Try to match spend requirements first
  const spendMatch = description
    .toLowerCase()
    .match(
      /(?:spend|purchase)\s+\$?(\d+(?:,\d{3})*(?:\.\d{2})?)\s+(?:in|within|over|during)\s+(\d+)\s*(day|month|year)s?/i
    );
  if (spendMatch) {
    const amount = parseFloat(spendMatch[1].replace(/,/g, ''));
    const period = parseInt(spendMatch[2]);
    const unit = spendMatch[3].toLowerCase();

    // Convert all periods to days for consistency
    const periodInDays =
      unit === 'month' ? period * 30 : unit === 'year' ? period * 365 : period;

    return {
      type: 'spend',
      details: {
        amount,
        period: periodInDays,
      },
    };
  }

  // Try to match deposit requirements
  const depositMatch = description
    .toLowerCase()
    .match(/(?:deposit|transfer in|maintain|keep)\s+\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
  if (depositMatch) {
    return {
      type: 'deposit',
      details: {
        amount: parseFloat(depositMatch[1].replace(/,/g, '')),
        period: 0,
      },
    };
  }

  // Try to match direct deposit requirements
  const ddMatch = description
    .toLowerCase()
    .match(/direct\s+deposit.*?\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
  if (ddMatch) {
    return {
      type: 'deposit',
      details: {
        amount: parseFloat(ddMatch[1].replace(/,/g, '')),
        period: 0,
      },
    };
  }

  return {
    type: 'other',
    details: {
      amount: 0,
      period: 0,
    },
  };
};

const transformBankRewardsOffer = (offer: BankRewardsOffer): Omit<Opportunity, 'id'> => {
  console.log('Starting transformation for offer:', offer.name);
  
  const requirements = extractRequirements(offer.bonus.requirements.description);
  const warnings: string[] = [];

  // Validate and collect warnings
  if (requirements.type === 'other') {
    warnings.push('Unable to automatically extract requirements');
    console.warn(`Could not extract requirements for ${offer.name}:`, offer.bonus.requirements.description);
  }
  if (!offer.details?.expiration) {
    warnings.push('No expiration date specified');
  }
  if (offer.value === 0) {
    warnings.push('Zero bonus value detected');
  }

  console.log('Extracted requirements:', requirements);
  console.log('Collected warnings:', warnings);

  const transformed = {
    name: offer.name,
    type: offer.type,
    bank: offer.name.split(' ')[0],
    value: offer.value,
    offer_link: offer.offer_link,
    description: offer.bonus.description,
    title: offer.bonus.title,
    status: 'pending',
    source: {
      name: 'bankrewards',
      collected_at: new Date().toISOString()
    },
    bonus: {
      title: offer.bonus.title,
      description: offer.bonus.description,
      value: offer.value,
      requirements: {
        title: offer.bonus.requirements.title,
        description: offer.bonus.requirements.description,
        spending_requirement: requirements.type === 'spend' ? {
          amount: requirements.details.amount,
          timeframe: `${requirements.details.period} days`
        } : null,
        extracted: requirements
      },
      tiers: offer.bonus.tiers ? offer.bonus.tiers.map(tier => ({
        reward: tier.reward,
        deposit: tier.deposit
      })) : null
    },
    details: {
      monthly_fees: offer.details.monthly_fees ? {
        amount: offer.details.monthly_fees.amount,
        waiver_details: offer.details.monthly_fees.waiver_details || null
      } : null,
      account_type: offer.details.account_type || null,
      availability: offer.details.availability || null,
      credit_inquiry: offer.details.credit_inquiry || null,
      credit_score: offer.details.credit_score ? {
        min: parseInt(offer.details.credit_score.replace(/.*?(\d+).*/, '$1')),
        recommended: null
      } : null,
      household_limit: offer.details.household_limit || null,
      early_closure_fee: offer.details.early_closure_fee || null,
      chex_systems: offer.details.chex_systems || null,
      expiration: offer.details.expiration || null,
      under_5_24: offer.details.under_5_24 ? {
        required: true,
        details: offer.details.under_5_24
      } : null,
      annual_fees: offer.details.annual_fees || null,
      foreign_transaction_fees: offer.details.foreign_transaction_fees || null,
      minimum_credit_limit: offer.details.minimum_credit_limit || null,
      rewards_structure: offer.details.rewards_structure ? {
        base_rewards: offer.details.rewards_structure,
        bonus_categories: [],
        welcome_bonus: null
      } : null,
      options_trading: offer.details.options_trading || null,
      ira_accounts: offer.details.ira_accounts || null
    },
    logo: offer.logo,
    card_image: offer.card_image || null,
    metadata: {
      created_at: offer.metadata.created,
      updated_at: offer.metadata.updated,
      created_by: 'bankrewards',
      status: 'active',
      warnings: warnings.length > 0 ? warnings : null
    }
  };

  console.log('Transformed offer:', transformed);
  return transformed;
};

const fetchBankRewardsOffers = async () => {
  const response = await fetch('http://localhost:3000/api/bankrewards?format=detailed');
  if (!response.ok) throw new Error('Failed to fetch from BankRewards API');
  const data = await response.json();
  return data as BankRewardsResponse;
};

const fetchPaginatedOpportunities = async (pagination: PaginationState) => {
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

const fetchStagedOpportunities = async () => {
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
        ...stagedSnapshot.docs.map(doc => doc.data().source_id),
        ...approvedSnapshot.docs.map(doc => doc.data().source_id),
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
        
        // Add new offer to staged_offers collection
        const docRef = doc(collection(db, 'staged_offers'));
        batch.set(docRef, {
          ...offer,
          createdAt: new Date().toISOString(),
        });
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
    }
  });

  // Approve opportunity mutation
  const approveOpportunityMutation = useMutation({
    mutationFn: async (opportunityData: Opportunity & { isStaged?: boolean }) => {
      if (opportunityData.isStaged) {
        // First create the API endpoint entry
        const apiResponse = await fetch('/api/opportunities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...opportunityData,
            status: 'approved',
            updatedAt: new Date().toISOString(),
          }),
        });

        if (!apiResponse.ok) {
          throw new Error('Failed to create API endpoint entry');
        }

        const apiData = await apiResponse.json();
        
        // Then add to opportunities collection with the same ID
        const opportunityRef = doc(db, 'opportunities', apiData.id);
        await setDoc(opportunityRef, {
          ...opportunityData,
          id: apiData.id,
          status: 'approved',
          updatedAt: new Date().toISOString(),
        });
        
        // Remove from staged_offers
        await deleteDoc(doc(db, 'staged_offers', opportunityData.id));
        return apiData.id;
      } else {
        // Update existing opportunity
        const opportunityRef = doc(db, 'opportunities', opportunityData.id);
        
        // Update both Firestore and API endpoint
        await Promise.all([
          updateDoc(opportunityRef, {
            status: 'approved',
            updatedAt: new Date().toISOString(),
          }),
          fetch(`/api/opportunities/${opportunityData.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: 'approved',
              updatedAt: new Date().toISOString(),
            }),
          }),
        ]);
        
        return opportunityData.id;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['opportunities']);
      queryClient.invalidateQueries(['staged_offers']);
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
    ...(paginatedData?.items || []).map(opp => ({
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

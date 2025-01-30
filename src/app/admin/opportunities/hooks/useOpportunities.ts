import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CryptoJS from 'crypto-js';
import { getAuth } from 'firebase/auth';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  deleteDoc,
  setDoc,
  DocumentData,
  QueryDocumentSnapshot,
  writeBatch,
  QuerySnapshot,
} from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';

import { db } from '@/lib/firebase/config';

import { Opportunity, Requirement, RequirementType } from '../types/opportunity';

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
      minimum_deposit?: number;
    };
    tiers?: {
      reward: string;
      deposit: string;
      level?: string;
      value?: number;
      minimum_deposit?: number;
      requirements?: string;
    }[];
    additional_info?: string;
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
    account_category?: string;
    availability?: {
      type: string;
      states?: string[];
      is_nationwide?: boolean;
    };
    credit_inquiry?: string;
    expiration?: string;
    credit_score?: string;
    under_5_24?: boolean;
    foreign_transaction_fees?: {
      percentage: string;
      waived: boolean;
    };
    minimum_credit_limit?: string;
    rewards_structure?: {
      base_rewards?: string;
      bonus_categories?: {
        category: string;
        rate: string;
      }[];
      welcome_bonus?: string;
    };
    household_limit?: string;
    early_closure_fee?: string;
    chex_systems?: string;
    options_trading?: string;
    ira_accounts?: string;
  };
  metadata?: {
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    updated_by?: string;
    status?: string;
    timing?: {
      bonus_posting_time: string;
    };
    availability?: {
      is_nationwide: boolean;
      regions?: string[];
    };
    credit?: {
      inquiry: string;
    };
    source?: {
      original_id: string;
      name?: string;
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

interface OpportunityFingerprint {
  source_id: string;
  name: string;
  value: number;
  requirements_hash: string;
}

const generateFingerprint = (offer: BankRewardsOffer): string => {
  const requirements = offer.bonus?.requirements?.description || '';
  const fp: OpportunityFingerprint = {
    source_id: offer.id,
    name: offer.name,
    value: offer.value,
    requirements_hash: CryptoJS.MD5(requirements).toString(),
  };
  return CryptoJS.MD5(JSON.stringify(fp)).toString();
};

const transformBankRewardsOffer = (offer: BankRewardsOffer): Opportunity => {
  const bank = offer.name?.split(' ')?.[0] || offer.name || '';

  // Parse requirements from description
  const parseRequirements = (
    description: string = '',
    type: 'bank' | 'credit_card' | 'brokerage'
  ): Requirement[] => {
    const requirements: Requirement[] = [];

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

    // Deposit and hold pattern
    const depositHoldMatch = description.match(
      /\$?(\d+[,\d]*(?:\.\d+)?)\s*deposit.*?(?:held|hold|maintain).*?(\d+)\s*(day|days)/i
    );
    if (depositHoldMatch && (type === 'bank' || type === 'brokerage')) {
      const amount = parseFloat(depositHoldMatch[1].replace(/,/g, ''));
      const holdPeriod = parseInt(depositHoldMatch[2]);
      requirements.push({
        type: 'deposit' as RequirementType,
        details: {
          amount,
          period: 30, // Default deposit period
          hold_period: holdPeriod,
        },
        description: `Deposit $${amount.toLocaleString()} and maintain for ${holdPeriod} days`,
        title: 'Deposit Requirement',
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
          amount: offer.value || 0,
          period: 60,
        },
        description: description.trim(),
        title: 'Bonus Requirements',
      };
      requirements.push(defaultReq);
    }

    return requirements;
  };

  // Transform requirements based on offer type and description
  const requirements = offer.bonus?.requirements?.description
    ? parseRequirements(offer.bonus.requirements.description, offer.type)
    : [];

  // Transform bonus tiers with proper null handling
  const tiers =
    offer.bonus?.tiers?.map((tier) => ({
      reward: tier.reward || '',
      deposit: tier.deposit || '',
      level: tier.level || null,
      value: tier.value ?? null,
      minimum_deposit: tier.minimum_deposit ?? null,
      requirements: tier.requirements || null,
    })) || [];

  // Transform bonus
  const bonus = {
    title: offer.bonus?.title || '',
    value: offer.value || 0,
    description: offer.bonus?.description || '',
    requirements,
    tiers: tiers.length > 0 ? tiers : null,
    additional_info: offer.bonus?.additional_info || null,
  };

  // Transform details
  const details = {
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
          states: offer.details.availability.states || [],
          is_nationwide: offer.details.availability.is_nationwide ?? true,
        }
      : null,
    credit_inquiry: offer.details?.credit_inquiry || null,
    expiration: offer.details?.expiration || null,
    credit_score: offer.details?.credit_score || null,
    under_5_24:
      offer.type === 'credit_card' && typeof offer.details?.under_5_24 === 'boolean'
        ? offer.details.under_5_24
        : null,
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
        }
      : null,
    household_limit: offer.details?.household_limit || null,
    early_closure_fee: offer.details?.early_closure_fee || null,
    chex_systems: offer.details?.chex_systems || null,
    options_trading: offer.details?.options_trading || null,
    ira_accounts: offer.details?.ira_accounts || null,
  };

  // Transform source metadata
  const source = {
    name: offer.metadata?.source?.name || 'bankrewards.io',
    collected_at: new Date().toISOString(),
    original_id: offer.metadata?.source?.original_id || offer.id,
    timing: offer.metadata?.timing || null,
    availability: offer.metadata?.availability || null,
    credit: offer.metadata?.credit || null,
  };

  return {
    id: offer.id,
    name: offer.name,
    type: offer.type,
    bank,
    value: offer.value,
    status: 'staged' as const,
    fingerprint: generateFingerprint(offer),
    metadata: {
      created_at: offer.metadata?.created_at || new Date().toISOString(),
      updated_at: offer.metadata?.updated_at || new Date().toISOString(),
      created_by: offer.metadata?.created_by || '',
      updated_by: offer.metadata?.updated_by || '',
      status: offer.metadata?.status || 'active',
      environment: process.env.NODE_ENV || 'development',
    },
    source,
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
  const snapshot = await getDocs(collection(db, 'staged_offers'));
  return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
    ...doc.data(),
    id: doc.id,
    status: 'staged' as const,
    isStaged: true,
  })) as (Opportunity & { isStaged: boolean })[];
};

// Add this type definition at the top of the file
type OpportunityWithValue = Opportunity & { value: number };

export function useOpportunities() {
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: ITEMS_PER_PAGE,
    sortBy: 'value',
    sortDirection: 'desc',
    filters: {},
  });

  // Query for paginated opportunities
  const {
    data: paginatedData,
    isLoading: isPaginatedLoading,
    error: paginatedError,
  } = useQuery({
    queryKey: ['opportunities', pagination],
    queryFn: () => fetchPaginatedOpportunities(pagination),
  });

  // Query for staged opportunities
  const { data: stagedData } = useQuery({
    queryKey: ['staged-opportunities'],
    queryFn: fetchStagedOpportunities,
  });

  // Query for bank rewards offers
  const { refetch: refetchBankRewards } = useQuery({
    queryKey: ['bank-rewards'],
    queryFn: fetchBankRewardsOffers,
  });

  const queryClient = useQueryClient();

  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    avgValue: number;
    highValue: number;
    highValueCount: number;
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
    highValueCount: 0,
    byType: {
      bank: 0,
      credit_card: 0,
      brokerage: 0,
    },
  });

  // Fetch total stats with detailed metrics - this is the single source of truth for stats
  const { data: totalStats } = useQuery({
    queryKey: ['opportunities', 'stats'],
    queryFn: async () => {
      const [mainSnapshot, stagedSnapshot] = await Promise.all([
        getDocs(
          query(
            collection(db, 'opportunities'),
            where('status', 'in', ['approved', 'pending'])
          )
        ),
        getDocs(collection(db, 'staged_offers')),
      ]);

      // Type-safe value extraction
      const getValue = (doc: QueryDocumentSnapshot<DocumentData>): number => {
        const data = doc.data() as OpportunityWithValue;
        return data.value || 0;
      };

      // Calculate pending counts by type
      const pendingByType = stagedSnapshot.docs.reduce(
        (acc, doc) => {
          const data = doc.data() as Opportunity;
          acc[data.type] = (acc[data.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Calculate high value count
      const highValueCount = stagedSnapshot.docs.filter((doc) => {
        const data = doc.data() as OpportunityWithValue;
        return data.value >= 500;
      }).length;

      // Calculate pending count and total value from staged offers
      const pendingValues = stagedSnapshot.docs.map(getValue);
      const pendingCount = stagedSnapshot.size;
      const pendingTotalValue = pendingValues.reduce((sum, value) => sum + value, 0);

      // Calculate approved count and total value from main collection
      const approvedValues = mainSnapshot.docs
        .filter((doc) => (doc.data() as Opportunity).status === 'approved')
        .map(getValue);
      const approvedCount = approvedValues.length;
      const approvedTotalValue = approvedValues.reduce((sum, value) => sum + value, 0);

      // Calculate total count and value
      const totalCount = pendingCount + approvedCount;
      const totalValue = pendingTotalValue + approvedTotalValue;

      // Calculate average value
      const avgValue = totalCount > 0 ? totalValue / totalCount : 0;

      return {
        total: totalCount,
        pending: pendingCount,
        approved: approvedCount,
        rejected: 0,
        avgValue: Math.round(avgValue),
        highValue: Math.max(...pendingValues, ...approvedValues, 0),
        highValueCount,
        byType: {
          bank: pendingByType['bank'] || 0,
          credit_card: pendingByType['credit_card'] || 0,
          brokerage: pendingByType['brokerage'] || 0,
        },
      };
    },
    staleTime: 1000 * 30,
  });

  // Remove the stats effect since we're using the query as single source of truth
  useEffect(() => {
    if (totalStats) {
      setStats(totalStats);
    }
  }, [totalStats]);

  // Combine opportunities ensuring no duplicates by source_id
  const allOpportunities = useMemo(() => {
    if (!paginatedData?.items || !stagedData) return [];

    const mainOpportunities = new Map(
      paginatedData.items.map((opp) => [opp.source_id, { ...opp, isStaged: false }])
    );
    const stagedOppMap = new Map(
      stagedData.map((opp) => [opp.source_id, { ...opp, isStaged: true }])
    );

    // Only add staged opportunities that don't exist in main collection
    stagedOppMap.forEach((stagedOpp, sourceId) => {
      if (!mainOpportunities.has(sourceId)) {
        mainOpportunities.set(sourceId, stagedOpp);
      }
    });

    return Array.from(mainOpportunities.values());
  }, [stagedData, paginatedData?.items]);

  const updatePagination = (updates: Partial<PaginationState>) => {
    setPagination((prev: PaginationState) => ({
      ...prev,
      ...updates,
      page: 'page' in updates ? updates.page! : 1,
    }));
  };

  // Approve opportunity mutation
  const approveMutation = useMutation({
    mutationKey: ['approve-opportunity'],
    mutationFn: async (opportunity: Opportunity & { isStaged?: boolean }) => {
      try {
        // Get user first to ensure we have authentication
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user?.email) {
          throw new Error('No authenticated user found');
        }

        // First, add to opportunities collection to ensure the ID exists
        const approvedOpportunity = {
          ...opportunity,
          status: 'approved' as const,
          updatedAt: new Date().toISOString(),
          metadata: {
            ...(opportunity.metadata || {}),
            created_by: user.email,
            updated_by: user.email,
            updated_at: new Date().toISOString(),
            status: 'active',
          },
        };

        await setDoc(doc(db, 'opportunities', opportunity.id), approvedOpportunity);

        // Transform to match API structure
        const formData = {
          id: opportunity.id,
          name: opportunity.name,
          type: opportunity.type,
          value: opportunity.value.toString(),
          description: opportunity.bonus.description || '',
          offer_link: opportunity.offer_link,
          source_id: opportunity.source_id,
          source: opportunity.source,
          status: 'approved',
          createdAt: opportunity.createdAt,
          bonus: {
            title: opportunity.bonus.title || '',
            description: opportunity.bonus.description || '',
            requirements: {
              title: 'Bonus Requirements',
              description: opportunity.bonus.requirements
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
            additional_info: opportunity.bonus.additional_info || null,
            tiers:
              opportunity.bonus.tiers?.map((tier) => ({
                reward: tier.reward || '',
                deposit: tier.deposit || '',
                level: tier.level || null,
                value: tier.value || null,
                minimum_deposit: tier.minimum_deposit || null,
                requirements: tier.requirements || null,
              })) || null,
          },
          details: {
            monthly_fees: opportunity.details?.monthly_fees || {
              amount: '0',
            },
            account_type: opportunity.details?.account_type || '',
            availability: opportunity.details?.availability || {
              type: 'Nationwide',
              states: [],
            },
            credit_inquiry: opportunity.details?.credit_inquiry || null,
            household_limit: opportunity.details?.household_limit || null,
            early_closure_fee: opportunity.details?.early_closure_fee || null,
            chex_systems: opportunity.details?.chex_systems || null,
            expiration: opportunity.details?.expiration || null,
            options_trading: opportunity.details?.options_trading || null,
            ira_accounts: opportunity.details?.ira_accounts || null,
            under_5_24:
              opportunity.details?.under_5_24 !== undefined
                ? opportunity.details.under_5_24
                : null,
            foreign_transaction_fees:
              opportunity.details?.foreign_transaction_fees || null,
            annual_fees: opportunity.details?.annual_fees || null,
          },
          logo: opportunity.logo || {
            type: '',
            url: '',
          },
          card_image:
            opportunity.type === 'credit_card'
              ? opportunity.card_image || {
                  url: '',
                  network: 'Unknown',
                  color: 'Unknown',
                  badge: null,
                }
              : null,
          metadata: {
            created_at: opportunity.createdAt || new Date().toISOString(),
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
        await deleteDoc(doc(db, 'staged_offers', opportunity.id));

        return approvedOpportunity;
      } catch (error) {
        console.error('Error in approveOpportunityMutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['staged-opportunities'] });
    },
  });

  // Reject opportunity mutation
  const rejectMutation = useMutation({
    mutationKey: ['reject-opportunity'],
    mutationFn: async (opportunity: Opportunity & { isStaged?: boolean }) => {
      if (opportunity.isStaged) {
        // Just remove from staged_offers
        await deleteDoc(doc(db, 'staged_offers', opportunity.id));
        return null;
      } else {
        // Update existing opportunity
        const opportunityRef = doc(db, 'opportunities', opportunity.id);
        await updateDoc(opportunityRef, {
          status: 'rejected',
          updatedAt: new Date().toISOString(),
        });
        return opportunity.id;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['staged-opportunities'] });
    },
  });

  // Bulk approve mutation
  const bulkApproveMutation = useMutation({
    mutationKey: ['bulk-approve-opportunities'],
    mutationFn: async (opportunities: (Opportunity & { isStaged?: boolean })[]) => {
      console.log(
        'Starting bulk approval process for',
        opportunities.length,
        'opportunities'
      );
      const results: string[] = [];
      const errors: Array<{ id: string; error: unknown }> = [];

      for (const opportunity of opportunities) {
        try {
          await approveMutation.mutateAsync(opportunity);
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
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['staged-opportunities'] });
    },
  });

  // Import opportunities mutation
  const importMutation = useMutation({
    mutationKey: ['import-opportunities'],
    mutationFn: async () => {
      console.log('Starting atomic import process');

      const { data: response } = await refetchBankRewards();

      if (!response?.data?.offers) {
        throw new Error('No offers found in response');
      }

      // Get all existing data in transaction
      const [mainSnapshot, stagedSnapshot] = await Promise.all([
        getDocs(collection(db, 'opportunities')),
        getDocs(query(collection(db, 'staged_offers'), orderBy('fingerprint'))),
      ]);

      // Create fingerprint maps
      const existingFingerprints = new Set<string>();
      const stagedFingerprints = new Set<string>();

      // Populate fingerprints from existing data
      mainSnapshot.docs.forEach((doc) => {
        existingFingerprints.add(doc.data().fingerprint);
      });

      stagedSnapshot.docs.forEach((doc) => {
        stagedFingerprints.add(doc.data().fingerprint);
      });

      // Generate new offers with fingerprints
      const newOffers = response.data.offers
        .map((offer) => ({
          offer,
          fingerprint: generateFingerprint(offer),
        }))
        .filter(
          ({ fingerprint }) =>
            !existingFingerprints.has(fingerprint) && !stagedFingerprints.has(fingerprint)
        );

      console.log(
        `Found ${newOffers.length} truly new offers out of ${response.data.offers.length}`
      );

      if (newOffers.length === 0) {
        console.log('No new offers to import');
        return 0;
      }

      // Atomic operation: Delete all existing staged offers first
      const deleteBatch = writeBatch(db);
      stagedSnapshot.docs.forEach((doc) => deleteBatch.delete(doc.ref));
      await deleteBatch.commit();
      console.log(`Cleared ${stagedSnapshot.size} existing staged offers`);

      // Add new offers in optimized batches
      let addBatch = writeBatch(db);
      const addedFingerprints = new Set<string>();
      let duplicatesSkipped = 0;

      for (const [index, { offer, fingerprint }] of newOffers.entries()) {
        if (addedFingerprints.has(fingerprint)) {
          duplicatesSkipped++;
          continue;
        }

        const docRef = doc(collection(db, 'staged_offers'));
        addBatch.set(docRef, {
          ...transformBankRewardsOffer(offer),
          id: docRef.id,
          fingerprint,
          metadata: {
            imported_at: new Date().toISOString(),
            source: 'bankrewards',
            first_seen: new Date().toISOString(),
            last_updated: new Date().toISOString(),
          },
        });
        addedFingerprints.add(fingerprint);

        // Commit every 500 operations
        if (index % 500 === 0 && index !== 0) {
          await addBatch.commit();
          addBatch = writeBatch(db);
        }
      }

      // Commit final batch
      if (addedFingerprints.size > 0) {
        await addBatch.commit();
      }

      console.log(
        `Added ${addedFingerprints.size} offers, skipped ${duplicatesSkipped} duplicates`
      );
      return addedFingerprints.size;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['staged-opportunities'] });
    },
  });

  // Purge data mutation
  const purgeMutation = useMutation({
    mutationKey: ['purge-opportunities'],
    mutationFn: async () => {
      const [stagedSnapshot, mainSnapshot] = await Promise.all([
        getDocs(collection(db, 'staged_offers')),
        getDocs(collection(db, 'opportunities')),
      ]);

      const deleteBatch = async (snapshot: QuerySnapshot<DocumentData>) => {
        const batchSize = 500;
        const batches = [];
        let currentBatch = writeBatch(db);
        let count = 0;

        snapshot.docs.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          currentBatch.delete(doc.ref);
          count++;
          if (count % batchSize === 0) {
            batches.push(currentBatch);
            currentBatch = writeBatch(db);
          }
        });

        if (count % batchSize !== 0) {
          batches.push(currentBatch);
        }

        await Promise.all(batches.map((b) => b.commit()));
      };

      await deleteBatch(stagedSnapshot);
      await deleteBatch(mainSnapshot);

      return {
        stagedDeleted: stagedSnapshot.size,
        opportunitiesDeleted: mainSnapshot.size,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['staged-opportunities'] });
    },
  });

  // Add to the hook's returned object
  const purgeAllData = purgeMutation.mutate;
  const isPurging = purgeMutation.isPending;

  return {
    opportunities: allOpportunities,
    pagination,
    updatePagination,
    hasMore: paginatedData?.hasMore || false,
    error: paginatedError ? (paginatedError as Error).message : null,
    loading: isPaginatedLoading,
    approveOpportunity: approveMutation.mutate,
    rejectOpportunity: rejectMutation.mutate,
    bulkApproveOpportunities: bulkApproveMutation.mutate,
    isBulkApproving: bulkApproveMutation.isPending,
    stats,
    importOpportunities: importMutation.mutate,
    isImporting: importMutation.isPending,
    hasStagedOpportunities: Array.isArray(stagedData) && stagedData.length > 0,
    purgeAllData,
    isPurging,
  };
}

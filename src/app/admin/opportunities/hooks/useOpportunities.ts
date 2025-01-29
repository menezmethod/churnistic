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
  metadata: {
    created_at: string;
    updated_at: string;
    created_by: string;
    status: string;
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

// Helper functions for requirement parsing
const parseSpendingRequirement = (description: string) => {
  const patterns = [
    // Credit card spending patterns
    /spend\s+\$?([0-9,]+)\s+(?:within|in)\s+(\d+)\s*(?:days?|months?)/i,
    /\$?([0-9,]+)\s+in\s+purchases?\s+within\s+(\d+)\s*(?:days?|months?)/i,
    // Direct deposit patterns
    /direct\s+deposits?\s+(?:of|totaling)\s+\$?([0-9,]+)\s+within\s+(\d+)\s*(?:days?|months?)/i,
    // Transfer patterns
    /transfer\s+\$?([0-9,]+)\s+(?:within|in)\s+(\d+)\s*(?:days?|months?)/i,
    /deposit\s+\$?([0-9,]+)\s+(?:within|in)\s+(\d+)\s*(?:days?|months?)/i
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      const amount = parseInt(match[1].replace(/,/g, ''));
      let period = parseInt(match[2]);
      // Convert months to days if period is in months
      if (description.toLowerCase().includes('month')) {
        period *= 30;
      }
      return { amount, period };
    }
  }
  return null;
};

const parseRecurringRequirements = (description: string) => {
  const patterns = [
    // Recurring direct deposits
    /(?:receive|get|earn)\s+(?:direct\s+deposits?)\s+(?:totaling|of)\s+\$?([0-9,]+)\s+(?:and|&)?\s*(?:make|complete)\s+(\d+)\s+(?:debit\s+card\s+)?(?:purchases?|transactions?)\s+(?:in|within|during|every)\s+(\d+)\s+days?/i,
    // Recurring transactions
    /make\s+(\d+)\s+(?:debit\s+card\s+)?(?:purchases?|transactions?)\s+(?:of|totaling)\s+\$?([0-9,]+)\s+(?:in|within|during|every)\s+(\d+)\s+days?/i
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      return {
        type: 'recurring',
        details: {
          deposit_amount: match[1] ? parseInt(match[1].replace(/,/g, '')) : null,
          transaction_count: match[2] ? parseInt(match[2]) : null,
          period: parseInt(match[3])
        }
      };
    }
  }
  return null;
};

const parseBrokerageRequirements = (description: string) => {
  const patterns = [
    // Account linking
    /link\s+(?:a|your)\s+bank\s+account/i,
    // Transfer requirements
    /transfer\s+\$?([0-9,]+)\s+(?:to|into)\s+(?:your|the)\s+(?:new\s+)?(?:account|brokerage)/i,
    // Stock rewards
    /(?:get|earn|receive)\s+(\d+)\s+(?:free\s+)?(?:stocks?|shares?)/i
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      if (pattern.source.includes('link')) {
        return {
          type: 'link_account',
          details: { required: true }
        };
      } else if (pattern.source.includes('transfer')) {
        return {
          type: 'transfer',
          details: {
            amount: parseInt(match[1].replace(/,/g, '')),
            period: 60 // Default to 60 days if not specified
          }
        };
      } else if (pattern.source.includes('stocks?|shares?')) {
        return {
          type: 'stock_reward',
          details: {
            quantity: parseInt(match[1])
          }
        };
      }
    }
  }
  return null;
};

// Update the requirements extraction in transformBankRewardsOffer
const extractRequirements = (offer: BankRewardsOffer) => {
  const description = offer.bonus.requirements.description || '';
  const requirements: any[] = [];

  if (offer.type === 'brokerage') {
    const brokerageReq = parseBrokerageRequirements(description);
    if (brokerageReq) {
      requirements.push(brokerageReq);
    }
    
    // Add minimum deposit if available
    if (offer.bonus.requirements.minimum_deposit) {
      requirements.push({
        type: 'minimum_deposit',
        details: {
          amount: offer.bonus.requirements.minimum_deposit,
          period: 60 // Default period for deposits
        }
      });
    }
  } else if (offer.type === 'credit_card') {
    const spendingReq = parseSpendingRequirement(description);
    if (spendingReq) {
      requirements.push({
        type: 'spending',
        details: spendingReq
      });
    }
  } else if (offer.type === 'bank') {
    const recurringReq = parseRecurringRequirements(description);
    if (recurringReq) {
      requirements.push(recurringReq);
    }

    const directDepositReq = parseSpendingRequirement(description);
    if (directDepositReq) {
      requirements.push({
        type: 'direct_deposit',
        details: directDepositReq
      });
    }

    // Add minimum deposit if available
    if (offer.bonus.requirements.minimum_deposit) {
      requirements.push({
        type: 'minimum_deposit',
        details: {
          amount: offer.bonus.requirements.minimum_deposit,
          period: 60
        }
      });
    }
  }

  // If no specific requirements found, add a generic requirement
  if (requirements.length === 0) {
    requirements.push({
      type: 'other',
      details: {
        description: description || 'Contact bank for specific requirements'
      }
    });
  }

  return requirements;
};

const transformBankRewardsOffer = (offer: BankRewardsOffer): Opportunity => {
  const bank = offer.name?.split(' ')?.[0] || offer.name || '';

  // Normalize household limit
  const normalizeHouseholdLimit = (limit: string | undefined) => {
    if (!limit) return null;
    if (limit.toLowerCase().includes('none')) return 'None';
    if (limit === '1' || limit.toLowerCase() === 'one') return '1';
    return limit;
  };

  // Normalize early closure fee
  const normalizeEarlyClosureFee = (fee: string | undefined) => {
    if (!fee) return null;
    return fee.replace(/#/g, '').trim();
  };

  // Ensure no undefined values in bonus
  const bonus = {
    title: offer.bonus.title || '',
    value: offer.value,
    description: offer.bonus.description || '',
    requirements: extractRequirements(offer),
    tiers:
      offer.bonus.tiers?.map((tier) => ({
        reward: tier.reward || '',
        deposit: tier.deposit || '',
        level: tier.level || null,
        value: tier.value || null,
        minimum_deposit: tier.minimum_deposit || null,
        requirements: tier.requirements || null,
      })) || [],
    additional_info: offer.bonus.additional_info || null,
  };

  // Ensure no undefined values in details
  const details = {
    monthly_fees: offer.details.monthly_fees || {
      amount: '0',
      waiver_details: null,
    },
    annual_fees: offer.details.annual_fees && offer.details.annual_fees.amount
      ? {
          amount: offer.details.annual_fees.amount,
          waived_first_year: offer.details.annual_fees.waived_first_year || false,
        }
      : null,
    account_type: offer.details.account_type || null,
    account_category: offer.details.account_category || null,
    availability: offer.details.availability || {
      type: 'Nationwide',
      states: [],
      is_nationwide: true,
    },
    credit_inquiry: offer.details.credit_inquiry || null,
    expiration: offer.details.expiration || null,
    credit_score: offer.details.credit_score || null,
    under_5_24: offer.details.under_5_24 !== undefined ? {
      required: offer.details.under_5_24,
      details: offer.details.under_5_24 ? 'This offer is available for accounts subject to the 5/24 rule' : 'This offer is available even if you\'ve opened 5+ accounts in the last 24 months'
    } : null,
    foreign_transaction_fees: offer.details.foreign_transaction_fees
      ? {
          percentage: offer.details.foreign_transaction_fees.percentage || '0%',
          waived: offer.details.foreign_transaction_fees.waived || false,
        }
      : null,
    minimum_credit_limit: offer.details.minimum_credit_limit || null,
    rewards_structure: offer.details.rewards_structure || null,
    household_limit: normalizeHouseholdLimit(offer.details.household_limit),
    early_closure_fee: normalizeEarlyClosureFee(offer.details.early_closure_fee),
    chex_systems: offer.details.chex_systems || null,
    options_trading: offer.details.options_trading || null,
    ira_accounts: offer.details.ira_accounts || null,
  };

  // Use original_id from metadata if available, otherwise use offer.id
  const source_id = offer.metadata?.source?.original_id || offer.id;

  return {
    id: source_id,
    name: offer.name,
    type: offer.type,
    bank,
    value: offer.value,
    status: 'staged' as const,
    source: {
      name: offer.metadata?.source?.name || 'bankrewards.io',
      collected_at: new Date().toISOString(),
      original_id: source_id,
      timing: offer.metadata?.timing || null,
      availability: offer.metadata?.availability || null,
      credit: offer.metadata?.credit || null,
    },
    source_id,
    bonus,
    details,
    logo: offer.logo || {
      type: '',
      url: '',
    },
    card_image: offer.card_image || null,
    offer_link: offer.offer_link || '',
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

        const formatRequirementsForAPI = (requirements: any[]) => {
          if (!requirements || requirements.length === 0) {
            return {
              title: 'Bonus Requirements',
              description: 'Contact bank for specific requirements'
            };
          }

          const descriptions = requirements.map(req => {
            switch (req.type) {
              case 'spending':
                return `Spend $${req.details.amount.toLocaleString()} within ${req.details.period} days`;
              case 'direct_deposit':
                return `Receive direct deposits totaling $${req.details.amount.toLocaleString()} within ${req.details.period} days`;
              case 'recurring':
                const parts = [];
                if (req.details.deposit_amount) {
                  parts.push(`Receive direct deposits of $${req.details.deposit_amount.toLocaleString()}`);
                }
                if (req.details.transaction_count) {
                  parts.push(`Make ${req.details.transaction_count} debit card purchases`);
                }
                return `${parts.join(' and ')} every ${req.details.period} days`;
              case 'transfer':
                return `Transfer $${req.details.amount.toLocaleString()} within ${req.details.period} days`;
              case 'link_account':
                return 'Link a bank account';
              case 'stock_reward':
                return `Receive ${req.details.quantity} free stocks`;
              case 'minimum_deposit':
                return `Maintain a minimum deposit of $${req.details.amount.toLocaleString()} for ${req.details.period} days`;
              default:
                return req.details.description || 'Contact bank for specific requirements';
            }
          });

          return {
            title: 'Bonus Requirements',
            description: descriptions.join(' AND ')
          };
        };

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
            requirements: formatRequirementsForAPI(opportunityData.bonus.requirements),
            additional_info: opportunityData.bonus.additional_info || null,
            tiers: opportunityData.bonus.tiers || null
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
            under_5_24: opportunityData.details?.under_5_24 !== undefined ? opportunityData.details.under_5_24 : null,
            foreign_transaction_fees: opportunityData.details?.foreign_transaction_fees || null,
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

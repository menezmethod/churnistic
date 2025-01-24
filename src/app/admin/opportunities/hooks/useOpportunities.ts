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
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '@/lib/firebase/config';

import { Opportunity } from '../types/opportunity';

interface BankRewardsOffer {
  id: string;
  name: string;
  type: string;
  value: number;
  bonus: {
    title: string;
    description: string;
    requirements: {
      title: string;
      description: string;
    };
    tiers?: {
      reward: string;
      deposit: string;
    }[];
  };
  details: {
    monthly_fees?: {
      amount: string;
    };
    annual_fees?: string;
    account_type?: string;
    availability?: {
      type: string;
      states?: string[];
    };
    credit_inquiry?: string;
    expiration?: string;
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

// Add type for status at the top
type OpportunityStatus = 'pending' | 'approved' | 'rejected';

const extractRequirements = (description: string) => {
  if (!description) return { type: 'other', details: { amount: 0, period: 0 } };

  // Try to match spend requirements first
  const spendMatch = description.toLowerCase().match(
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
  const depositMatch = description.toLowerCase().match(
    /(?:deposit|transfer in|maintain|keep)\s+\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i
  );
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
  const ddMatch = description.toLowerCase().match(
    /direct\s+deposit.*?\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i
  );
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
  const requirements = extractRequirements(offer.bonus.requirements.description);
  const warnings: string[] = [];

  // Validate and collect warnings
  if (requirements.type === 'other') {
    warnings.push('Unable to automatically extract requirements');
  }
  if (!offer.details?.expiration) {
    warnings.push('No expiration date specified');
  }
  if (offer.value === 0) {
    warnings.push('Zero bonus value detected');
  }

  // Ensure all optional fields are null instead of undefined
  const transformedOffer = {
    name: offer.name,
    type: offer.type,
    bank: offer.name.split(' ')[0],
    value: offer.value,
    status: 'pending' as OpportunityStatus,
    source: {
      name: 'bankrewards',
      collected_at: offer.metadata.created,
    },
    source_id: offer.id,
    bonus: {
      title: offer.bonus.title,
      value: offer.value,
      description: offer.bonus.description,
      requirements: [requirements],
      tiers: offer.bonus.tiers || null,
    },
    details: {
      monthly_fees: offer.details.monthly_fees || null,
      annual_fees: offer.details.annual_fees || null,
      account_type: offer.details.account_type || null,
      availability: offer.details.availability || null,
      credit_inquiry: offer.details.credit_inquiry || null,
      expiration: offer.details.expiration || null,
    },
    logo: offer.logo,
    card_image: offer.card_image || null,
    processing_status: {
      source_validation: true,
      ai_processed: true,
      duplicate_checked: false,
      needs_review: true,
    },
    ai_insights: {
      confidence_score: requirements.type === 'other' ? 0.6 : 0.9,
      validation_warnings: warnings,
      potential_duplicates: [],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return transformedOffer;
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

const cleanupDuplicates = async (opportunities: Opportunity[]) => {
  const batch = writeBatch(db);
  const sourceIdGroups = new Map<string, Opportunity[]>();
  const nameGroups = new Map<string, Opportunity[]>();
  const keepIds = new Set<string>();
  let deletedCount = 0;

  // Group opportunities by source_id and name
  opportunities.forEach((opp) => {
    if (opp.source_id) {
      const group = sourceIdGroups.get(opp.source_id) || [];
      group.push(opp);
      sourceIdGroups.set(opp.source_id, group);
    }

    const normalizedName = opp.name.toLowerCase().trim();
    const group = nameGroups.get(normalizedName) || [];
    group.push(opp);
    nameGroups.set(normalizedName, group);
  });

  // For each group, keep only the newest opportunity
  sourceIdGroups.forEach((group) => {
    const newest = group.reduce((a, b) => {
      const aDate = a.updatedAt || a.createdAt || '';
      const bDate = b.updatedAt || b.createdAt || '';
      return aDate > bDate ? a : b;
    });
    keepIds.add(newest.id);
  });

  nameGroups.forEach((group) => {
    // Skip if all opportunities in this group are already marked to keep
    if (group.every((opp) => keepIds.has(opp.id))) {
      return;
    }

    const newest = group.reduce((a, b) => {
      const aDate = a.updatedAt || a.createdAt || '';
      const bDate = b.updatedAt || b.createdAt || '';
      return aDate > bDate ? a : b;
    });
    keepIds.add(newest.id);
  });

  // Delete all opportunities not marked to keep
  for (const opp of opportunities) {
    if (!keepIds.has(opp.id)) {
      const ref = doc(db, 'opportunities', opp.id);
      batch.delete(ref);
      deletedCount++;
    }
  }

  if (deletedCount > 0) {
    await batch.commit();
    console.log(`Cleaned up ${deletedCount} duplicate opportunities`);
  }

  return deletedCount;
};

export const useOpportunities = (initialPagination: Partial<PaginationState> = {}) => {
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: ITEMS_PER_PAGE,
    sortBy: 'updatedAt',
    sortDirection: 'desc',
    filters: {},
    ...initialPagination,
  });

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
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

  // Fetch total stats
  const { data: totalStats } = useQuery({
    queryKey: ['opportunities', 'stats'],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, 'opportunities'));
      const opportunities = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Opportunity[];
      return {
        total: opportunities.length,
        pending: opportunities.filter((opp) => opp.status === 'pending').length,
        approved: opportunities.filter((opp) => opp.status === 'approved').length,
        rejected: opportunities.filter((opp) => opp.status === 'rejected').length,
      };
    },
  });

  // Fetch and sync BankRewards offers
  const { data: bankRewardsData } = useQuery({
    queryKey: ['bankRewardsOffers'],
    queryFn: fetchBankRewardsOffers,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Modify the stageNewOpportunities mutation
  const { mutateAsync: stageNewOpportunities } = useMutation({
    mutationFn: async (offers: BankRewardsOffer[]) => {
      console.log(`Processing ${offers.length} offers from API`);

      // First, get all existing opportunities
      const snapshot = await getDocs(collection(db, 'opportunities'));
      const opportunities = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Opportunity[];

      // Group by source_id and name for deduplication
      const sourceIdGroups = new Map<string, Opportunity[]>();
      const nameGroups = new Map<string, Opportunity[]>();
      const keepIds = new Set<string>();

      // Group existing opportunities
      opportunities.forEach((opp) => {
        if (opp.source_id) {
          const group = sourceIdGroups.get(opp.source_id) || [];
          group.push(opp);
          sourceIdGroups.set(opp.source_id, group);
        }
        const normalizedName = opp.name.toLowerCase().trim();
        const group = nameGroups.get(normalizedName) || [];
        group.push(opp);
        nameGroups.set(normalizedName, group);
      });

      // Keep only the newest opportunity from each group
      sourceIdGroups.forEach((group) => {
        const newest = group.reduce((a, b) =>
          (a.updatedAt || a.createdAt || '') > (b.updatedAt || b.createdAt || '') ? a : b
        );
        keepIds.add(newest.id);
      });

      nameGroups.forEach((group) => {
        if (!group.some((opp) => keepIds.has(opp.id))) {
          const newest = group.reduce((a, b) =>
            (a.updatedAt || a.createdAt || '') > (b.updatedAt || b.createdAt || '')
              ? a
              : b
          );
          keepIds.add(newest.id);
        }
      });

      // Start batching operations
      const batch = writeBatch(db);
      let deletedCount = 0;
      let addedCount = 0;
      let updatedCount = 0;

      // Delete duplicates
      for (const opp of opportunities) {
        if (!keepIds.has(opp.id)) {
          batch.delete(doc(db, 'opportunities', opp.id));
          deletedCount++;
        }
      }

      // Process new offers
      const existingBySourceId = new Map(
        opportunities
          .filter((opp) => keepIds.has(opp.id))
          .map((opp) => [opp.source_id, opp])
      );
      const existingByName = new Map(
        opportunities
          .filter((opp) => keepIds.has(opp.id))
          .map((opp) => [opp.name.toLowerCase().trim(), opp])
      );

      for (const offer of offers) {
        const normalizedName = offer.name.toLowerCase().trim();
        const existing =
          existingBySourceId.get(offer.id) || existingByName.get(normalizedName);
        const transformedOffer = transformBankRewardsOffer(offer);

        if (existing) {
          batch.update(doc(db, 'opportunities', existing.id), {
            ...transformedOffer,
            status: existing.status,
            updatedAt: new Date().toISOString(),
          });
          updatedCount++;
        } else {
          batch.set(doc(collection(db, 'opportunities')), transformedOffer);
          addedCount++;
        }
      }

      // Commit all changes
      await batch.commit();

      return {
        processed: offers.length,
        added: addedCount,
        updated: updatedCount,
        deleted: deletedCount,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      console.log(
        `Sync complete: processed ${result.processed} offers, added ${result.added} new ones, ` +
          `updated ${result.updated} existing ones, deleted ${result.deleted} duplicates`
      );
    },
    onError: (error) => {
      console.error('Error syncing offers:', error);
    },
  });

  // Approve opportunity mutation
  const { mutateAsync: approveOpportunity } = useMutation({
    mutationFn: async (id: string) => {
      const opportunityRef = doc(db, 'opportunities', id);
      await updateDoc(opportunityRef, {
        status: 'approved',
        'processing_status.needs_review': false,
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  // Reject opportunity mutation
  const { mutateAsync: rejectOpportunity } = useMutation({
    mutationFn: async (id: string) => {
      const opportunityRef = doc(db, 'opportunities', id);
      await updateDoc(opportunityRef, {
        status: 'rejected',
        'processing_status.needs_review': false,
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  useEffect(() => {
    if (totalStats) {
      setStats(totalStats);
    }
  }, [totalStats]);

  // Update the sync effect to use the result
  useEffect(() => {
    if (bankRewardsData?.data.offers) {
      stageNewOpportunities(bankRewardsData.data.offers)
        .then((result) => {
          console.log('Sync stats:', result);
        })
        .catch((error) => {
          console.error('Error syncing offers:', error);
        });
    }
  }, [bankRewardsData, stageNewOpportunities]);

  // Add immediate cleanup effect
  useEffect(() => {
    const runInitialCleanup = async () => {
      const items = paginatedData?.items;
      if (items?.length && bankRewardsData?.data?.stats) {
        const { total: apiTotal } = bankRewardsData.data.stats;
        if (items.length > apiTotal) {
          console.log('Running initial cleanup due to size mismatch...');
          await cleanupDuplicates(items);
          queryClient.invalidateQueries({ queryKey: ['opportunities'] });
        }
      }
    };

    runInitialCleanup();
  }, [paginatedData?.items, bankRewardsData?.data?.stats, queryClient]);

  const updatePagination = (updates: Partial<PaginationState>) => {
    setPagination((prev) => ({
      ...prev,
      ...updates,
      // Reset to page 1 if anything but page number changes
      page: 'page' in updates ? updates.page! : 1,
    }));
  };

  return {
    opportunities: paginatedData?.items || [],
    pagination,
    updatePagination,
    hasMore: paginatedData?.hasMore || false,
    error: paginationError ? (paginationError as Error).message : null,
    loading: isPaginationLoading,
    approveOpportunity,
    rejectOpportunity,
    stats,
  };
};

import { useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDebounce } from 'use-debounce';

import { Opportunity } from '@/types/opportunity';

export type FilterType = 
  | 'premium_offers' 
  | 'credit_card' 
  | 'bank' 
  | 'brokerage' 
  | 'quick_bonus' 
  | 'nationwide' 
  | null;

export type SortType = 'value' | 'regions' | 'date';

export interface OpportunityFiltersState {
  searchTerm: string;
  activeFilter: FilterType;
  selectedBank: string | null;
  sortBy: SortType;
}

interface UseOpportunityFiltersProps {
  opportunities: Opportunity[];
  initialFilters?: Partial<OpportunityFiltersState>;
  onFilterChange?: (filters: OpportunityFiltersState) => void;
}

export function useOpportunityFilters({
  opportunities,
  initialFilters,
  onFilterChange,
}: UseOpportunityFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  // Initialize filters from URL or initial props
  const [filters, setFilters] = useState<OpportunityFiltersState>({
    searchTerm: searchParams.get('search') || initialFilters?.searchTerm || '',
    activeFilter: (searchParams.get('filter') as FilterType) || initialFilters?.activeFilter || null,
    selectedBank: searchParams.get('bank') || initialFilters?.selectedBank || null,
    sortBy: (searchParams.get('sortBy') as SortType) || initialFilters?.sortBy || 'value',
  });

  // Debounce search term to avoid excessive filtering
  const [debouncedSearchTerm] = useDebounce(filters.searchTerm, 300);

  // Sync URL with filters
  useEffect(() => {
    startTransition(() => {
      const params = new URLSearchParams();
      
      if (filters.searchTerm) params.set('search', filters.searchTerm);
      if (filters.activeFilter) params.set('filter', filters.activeFilter);
      if (filters.selectedBank) params.set('bank', filters.selectedBank);
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      router.replace(newUrl, { scroll: false });
    });
  }, [filters, router]);

  // Notify parent component of filter changes
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filters);
    }
  }, [filters, onFilterChange]);

  // Get unique banks from opportunities
  const availableBanks = useMemo(() => {
    const banks = new Set<string>();
    opportunities.forEach((opp) => {
      if (opp.name) {
        const bankName = opp.name.split(' ')[0]; // Get first word as bank name
        banks.add(bankName);
      }
    });
    return Array.from(banks).sort();
  }, [opportunities]);

  // Update a single filter
  const updateFilter = useCallback(<K extends keyof OpportunityFiltersState>(
    key: K,
    value: OpportunityFiltersState[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Invalidate relevant queries when filters change
    queryClient.invalidateQueries({ queryKey: ['opportunities'] });
  }, [queryClient]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      activeFilter: null,
      selectedBank: null,
      sortBy: 'value',
    });
    queryClient.invalidateQueries({ queryKey: ['opportunities'] });
  }, [queryClient]);

  // Filter and sort opportunities
  const filteredOpportunities = useMemo(() => {
    console.log('Filtering opportunities:', {
      searchTerm: debouncedSearchTerm,
      activeFilter: filters.activeFilter,
      selectedBank: filters.selectedBank,
      sortBy: filters.sortBy,
    });

    let filtered = [...opportunities];

    // Apply search term filter
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (opp) =>
          opp.name.toLowerCase().includes(term) ||
          opp.type.toLowerCase().includes(term) ||
          (typeof opp.bonus?.description === 'string' && 
            opp.bonus.description.toLowerCase().includes(term))
      );
    }

    // Apply active filter
    if (filters.activeFilter) {
      switch (filters.activeFilter) {
        case 'premium_offers':
          filtered = filtered.filter((opp) => parseInt(String(opp.value)) >= 500);
          break;
        case 'credit_card':
          filtered = filtered.filter((opp) => opp.type === 'credit_card');
          break;
        case 'bank':
          filtered = filtered.filter((opp) => opp.type === 'bank');
          break;
        case 'brokerage':
          filtered = filtered.filter((opp) => opp.type === 'brokerage');
          break;
        case 'quick_bonus':
          filtered = filtered.filter((opp) => {
            const bonusDesc = typeof opp.bonus?.description === 'string' 
              ? opp.bonus.description.toLowerCase() 
              : '';
            return (
              bonusDesc.includes('single') ||
              bonusDesc.includes('one time') ||
              bonusDesc.includes('first')
            );
          });
          break;
        case 'nationwide':
          filtered = filtered.filter(
            (opp) => opp.details?.availability?.type === 'Nationwide'
          );
          break;
      }
    }

    // Apply bank filter
    if (filters.selectedBank) {
      filtered = filtered.filter((opp) =>
        opp.name.toLowerCase().startsWith(filters.selectedBank!.toLowerCase())
      );
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'value':
        filtered.sort((a, b) => parseInt(String(b.value)) - parseInt(String(a.value)));
        break;
      case 'regions':
        filtered.sort((a, b) => {
          const aRegions = a.details?.availability?.states?.length || 0;
          const bRegions = b.details?.availability?.states?.length || 0;
          return bRegions - aRegions;
        });
        break;
      case 'date':
        filtered.sort(
          (a, b) => {
            const aDate = a.created_at || (a.metadata?.created_at ? new Date(a.metadata.created_at).getTime() : 0);
            const bDate = b.created_at || (b.metadata?.created_at ? new Date(b.metadata.created_at).getTime() : 0);
            return typeof bDate === 'number' && typeof aDate === 'number' ? bDate - aDate : 0;
          }
        );
        break;
    }

    console.log('Filtered opportunities:', filtered.length);
    return filtered;
  }, [opportunities, debouncedSearchTerm, filters.activeFilter, filters.selectedBank, filters.sortBy]);

  return {
    // Filter state
    filters,
    
    // Derived data
    filteredOpportunities,
    availableBanks,
    isPending,
    
    // Filter actions
    setSearchTerm: (value: string) => updateFilter('searchTerm', value),
    setActiveFilter: (value: FilterType) => updateFilter('activeFilter', value),
    setSelectedBank: (value: string | null) => updateFilter('selectedBank', value),
    setSortBy: (value: SortType) => updateFilter('sortBy', value),
    resetFilters,
    
    // For backward compatibility
    searchTerm: filters.searchTerm,
    activeFilter: filters.activeFilter,
    selectedBank: filters.selectedBank,
    sortBy: filters.sortBy,
  };
}

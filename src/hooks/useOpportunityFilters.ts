import { useState, useMemo } from 'react';

import { FormData } from '@/types/opportunity';

export function useOpportunityFilters(opportunities: FormData[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'value' | 'regions' | 'date'>('value');

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

  // Filter and sort opportunities
  const filteredOpportunities = useMemo(() => {
    console.log('Filtering opportunities:', {
      searchTerm,
      activeFilter,
      selectedBank,
      sortBy,
    });

    let filtered = [...opportunities];

    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (opp) =>
          opp.name.toLowerCase().includes(term) ||
          opp.type.toLowerCase().includes(term) ||
          opp.bonus.description.toLowerCase().includes(term)
      );
    }

    // Apply active filter
    if (activeFilter) {
      switch (activeFilter) {
        case 'premium_offers':
          filtered = filtered.filter((opp) => parseInt(opp.value) >= 500);
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
            const bonusDesc = opp.bonus?.description?.toLowerCase() || '';
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
    if (selectedBank) {
      filtered = filtered.filter((opp) =>
        opp.name.toLowerCase().startsWith(selectedBank.toLowerCase())
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'value':
        filtered.sort((a, b) => parseInt(b.value) - parseInt(a.value));
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
          (a, b) =>
            new Date(b.metadata.created_at).getTime() -
            new Date(a.metadata.created_at).getTime()
        );
        break;
    }

    console.log('Filtered opportunities:', filtered.length);
    return filtered;
  }, [opportunities, searchTerm, activeFilter, selectedBank, sortBy]);

  return {
    searchTerm,
    setSearchTerm,
    activeFilter,
    setActiveFilter,
    selectedBank,
    setSelectedBank,
    availableBanks,
    sortBy,
    setSortBy,
    filteredOpportunities,
  };
}

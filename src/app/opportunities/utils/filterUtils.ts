import { FirestoreOpportunity } from '@/types/opportunity';

export const sortAndFilterOpportunities = (
  opportunities: FirestoreOpportunity[],
  searchTerm: string,
  selectedType: string | null,
  sortBy: 'value' | 'name' | 'type' | 'date' | null,
  sortOrder: 'asc' | 'desc'
): FirestoreOpportunity[] => {
  if (!opportunities) return [];

  let filtered = [...opportunities];

  // Apply type filter first - ensure exact match
  if (selectedType) {
    filtered = filtered.filter((opp) => {
      // Ensure strict type comparison
      return opp.type === selectedType;
    });
  }

  // Then apply search filter if present
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter((opp) => {
      const searchFields = [
        opp.name,
        opp.description,
        opp.type,
        opp.bonus?.description,
        opp.details?.availability?.type,
        opp.details?.account_type,
      ];

      return searchFields.some(
        (field) => field && field.toString().toLowerCase().includes(term)
      );
    });
  }

  // Finally, sort the results
  if (sortBy) {
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'value':
          // Ensure numeric comparison
          const aValue =
            typeof a.value === 'number' ? a.value : parseFloat(a.value as string) || 0;
          const bValue =
            typeof b.value === 'number' ? b.value : parseFloat(b.value as string) || 0;
          comparison = bValue - aValue;
          break;
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'type':
          comparison = (a.type || '').localeCompare(b.type || '');
          break;
        case 'date':
          const aDate = a.metadata?.created_at || '';
          const bDate = b.metadata?.created_at || '';
          comparison = new Date(bDate).getTime() - new Date(aDate).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  return filtered;
};

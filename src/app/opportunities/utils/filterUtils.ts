import { FirestoreOpportunity } from '@/types/opportunity';

export const sortAndFilterOpportunities = (
  opportunities: FirestoreOpportunity[],
  searchTerm: string,
  selectedType: string | null,
  sortBy: 'value' | 'name' | 'type' | 'date' | null,
  sortOrder: 'asc' | 'desc'
) => {
  if (!opportunities) return [];

  return opportunities
    .filter((opp): opp is FirestoreOpportunity => {
      if (!opp.id) return false;

      const matchesSearch =
        !searchTerm ||
        [opp.name, opp.description, opp.bonus?.description].some((text) =>
          text?.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesType = !selectedType || opp.type === selectedType;

      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (!sortBy) return 0;

      let comparison = 0;
      switch (sortBy) {
        case 'value':
          const aTotal = (a.bonus?.tiers?.[0]?.value || 0) + a.value;
          const bTotal = (b.bonus?.tiers?.[0]?.value || 0) + b.value;
          comparison = bTotal - aTotal;
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
      return sortOrder === 'asc' ? -comparison : comparison;
    });
};

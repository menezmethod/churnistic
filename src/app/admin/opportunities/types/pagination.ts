export interface OpportunityFilters {
  type?: 'bank' | 'credit_card' | 'brokerage';
  status?: 'staged' | 'pending' | 'approved' | 'rejected';
  bank?: string;
  minValue?: number;
  maxValue?: number;
  searchTerm?: string;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  filters?: Partial<OpportunityFilters>;
}

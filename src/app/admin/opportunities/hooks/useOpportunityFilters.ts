import { useState, useCallback } from 'react';

import { PaginationConfig } from '@/app/admin/opportunities/types/pagination';

interface UseOpportunityFiltersReturn {
  pagination: PaginationConfig;
  updatePagination: (updates: Partial<PaginationConfig>) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleSort: (field: string) => void;
  handlePageChange: (newPage: number, newPageSize: number) => void;
}

export const useOpportunityFilters = (): UseOpportunityFiltersReturn => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 1,
    pageSize: 10,
    sortBy: 'name',
    sortDirection: 'asc',
    filters: {},
  });

  const updatePagination = useCallback((updates: Partial<PaginationConfig>) => {
    setPagination((prev) => ({
      ...prev,
      ...updates,
      filters: {
        ...prev.filters,
        ...(updates.filters || {}),
      },
    }));
  }, []);

  const handleSort = useCallback(
    (field: string) => {
      updatePagination({
        sortBy: field,
        sortDirection:
          pagination.sortBy === field && pagination.sortDirection === 'asc'
            ? 'desc'
            : 'asc',
      });
    },
    [pagination.sortBy, pagination.sortDirection, updatePagination]
  );

  const handlePageChange = useCallback(
    (newPage: number, newPageSize: number) => {
      updatePagination({
        page: newPage,
        pageSize: newPageSize,
      });
    },
    [updatePagination]
  );

  const handleSearchChange = useCallback(
    (term: string) => {
      setSearchTerm(term);
      updatePagination({
        page: 1,
        filters: {
          searchTerm: term || undefined,
        },
      });
    },
    [updatePagination]
  );

  return {
    pagination,
    updatePagination,
    searchTerm,
    setSearchTerm: handleSearchChange,
    handleSort,
    handlePageChange,
  };
};

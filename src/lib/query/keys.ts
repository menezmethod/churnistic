interface PaginationParams {
  page: number;
  pageSize: number;
  filters?: Record<string, unknown>;
}

export const opportunityKeys = {
  all: ['opportunities'] as const,
  detail: (id: string) => ['opportunity', id] as const,
  lists: {
    paginated: (params: PaginationParams) =>
      ['opportunities', 'paginated', params] as const,
    staged: ['opportunities', 'staged'] as const,
    approved: ['opportunities', 'approved'] as const,
    rejected: ['opportunities', 'rejected'] as const,
  },
  mutations: {
    update: (id: string) => ['opportunity', 'update', id] as const,
    delete: (id: string) => ['opportunity', 'delete', id] as const,
  },
} as const;

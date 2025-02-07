import { PaginationState } from '../types/opportunity';

export const ITEMS_PER_PAGE = 20;

export const QUERY_KEYS = {
  opportunities: {
    all: ['opportunities'] as const,
    paginated: (pagination: PaginationState) =>
      ['opportunities', 'paginated', pagination] as const,
    staged: ['opportunities', 'staged'] as const,
    approved: ['opportunities', 'approved'] as const,
    stats: ['opportunities', 'stats'] as const,
  },
};

export const API_ENDPOINTS = {
  opportunities: {
    base: '/api/listings',
    staged: '/api/listings/staged',
    approve: '/api/listings/approve',
    reject: (id: string) => `/api/listings/${id}?action=reject`,
    bulkApprove: '/api/listings/approve/bulk',
    reset: '/api/listings/reset',
    stats: '/api/listings/stats',
  },
  proxy: {
    bankrewards: '/api/proxy/bankrewards',
  },
};

export const STATUS_CONFIGS = {
  staged: {
    label: 'Staged',
    color: 'info',
  },
  pending: {
    label: 'Pending',
    color: 'warning',
  },
  approved: {
    label: 'Approved',
    color: 'success',
  },
  rejected: {
    label: 'Rejected',
    color: 'error',
  },
} as const;

export const OPPORTUNITY_TYPES = {
  bank: {
    label: 'Bank',
    color: 'success',
  },
  credit_card: {
    label: 'Credit Card',
    color: 'info',
  },
  brokerage: {
    label: 'Brokerage',
    color: 'warning',
  },
} as const;

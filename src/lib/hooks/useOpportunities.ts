import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { getAuth } from 'firebase/auth';
import { useMemo, useEffect } from 'react';

import { FirestoreOpportunity } from '@/types/opportunity';

const API_BASE = '/api/opportunities';
const PAGE_SIZE = 20;

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    console.error('API Error:', {
      status: response.status,
      url: response.url,
      headers: Object.fromEntries(response.headers.entries()),
    });
    try {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Request failed');
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      throw e;
    }
  }
  try {
    const data = await response.json();
    console.log('API Response:', {
      status: response.status,
      url: response.url,
      data: Array.isArray(data?.items)
        ? {
            count: data.items.length,
            total: data.total,
            hasMore: data.hasMore,
            sample: data.items[0]
              ? {
                  id: data.items[0].id,
                  name: data.items[0].name,
                  type: data.items[0].type,
                }
              : null,
          }
        : data,
    });
    return data;
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error('Invalid JSON response from server');
    }
    throw e;
  }
}

const getOpportunities = async ({
  pageParam = 1,
  limit = PAGE_SIZE,
  searchTerm = '',
  type = null,
  sortBy = 'value',
  sortDirection = 'desc',
  status = 'approved,staged,pending',
}: {
  pageParam?: number;
  limit?: number;
  searchTerm?: string;
  type?: string | null;
  sortBy?: 'value' | 'name' | 'type' | 'date' | null;
  sortDirection?: 'asc' | 'desc';
  status?: string;
}): Promise<{
  items: FirestoreOpportunity[];
  nextPage: number | null;
  total: number;
  hasMore: boolean;
}> => {
  console.log('Fetching items with params:', {
    page: pageParam,
    limit,
    searchTerm,
    type,
    sortBy,
    sortDirection,
    status,
  });

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const url = new URL('/api/opportunities', baseUrl || window.location.origin);

  // Add query parameters
  url.searchParams.set('page', pageParam.toString());
  url.searchParams.set('pageSize', limit.toString());
  if (sortBy) url.searchParams.set('sortBy', sortBy);
  if (sortDirection) url.searchParams.set('sortDirection', sortDirection);
  if (searchTerm) url.searchParams.set('search', searchTerm);
  if (status) url.searchParams.set('status', status);
  if (type) url.searchParams.set('type', type);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(url, { headers });
    const data = await handleResponse<{
      items: FirestoreOpportunity[];
      total: number;
      hasMore: boolean;
    }>(response);

    return {
      items: data.items,
      nextPage: data.hasMore ? pageParam + 1 : null,
      total: data.total,
      hasMore: data.hasMore,
    };
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    throw error;
  }
};

const createOpportunity = async (
  data: Omit<FirestoreOpportunity, 'id'>
): Promise<FirestoreOpportunity> => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user found');
  }

  const token = await user.getIdToken();
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...data,
      metadata: {
        ...data.metadata,
        created_by: user.email,
        updated_by: user.email,
      },
    }),
  });
  return handleResponse<FirestoreOpportunity>(response);
};

const updateOpportunity = async (params: {
  id: string;
  data: Partial<FirestoreOpportunity>;
}): Promise<FirestoreOpportunity> => {
  const { id, data } = params;
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user found');
  }

  const token = await user.getIdToken();
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...data,
      metadata: {
        ...data.metadata,
        updated_by: user.email,
        updated_at: new Date().toISOString(),
      },
    }),
  });
  return handleResponse<FirestoreOpportunity>(response);
};

// Type guard for FirestoreOpportunity
function isFirestoreOpportunity(response: unknown): response is FirestoreOpportunity {
  return (
    typeof response === 'object' &&
    response !== null &&
    'id' in response &&
    'metadata' in response
  );
}

const deleteOpportunity = async (id: string): Promise<void> => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user found');
  }

  const token = await user.getIdToken();
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete opportunity');
  }
};

interface OpportunitiesResponse {
  items: FirestoreOpportunity[];
  nextPage: number | null;
  total: number;
  hasMore: boolean;
}

interface OpportunitiesParams {
  searchTerm?: string;
  type?: string | null;
  sortBy?: 'value' | 'name' | 'type' | 'date' | null;
  sortDirection?: 'asc' | 'desc';
  status?: string;
  limit?: number;
}

export function useOpportunities(params?: OpportunitiesParams) {
  const queryClient = useQueryClient();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, error, refetch } =
    useInfiniteQuery<
      OpportunitiesResponse,
      Error,
      InfiniteData<OpportunitiesResponse>,
      [string, OpportunitiesParams | undefined],
      number
    >({
      queryKey: ['opportunities', params],
      queryFn: async ({ pageParam }) =>
        getOpportunities({
          ...params,
          pageParam: pageParam as number,
          limit: params?.limit || PAGE_SIZE,
        }),
      getNextPageParam: (lastPage) => lastPage.nextPage,
      initialPageParam: 1,
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 5,
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      maxPages: 5,
    });

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      const currentPage = data?.pages[data.pages.length - 1];
      const nextPageParam = currentPage?.nextPage;

      if (nextPageParam) {
        queryClient.prefetchInfiniteQuery({
          queryKey: ['opportunities', params],
          queryFn: () =>
            getOpportunities({
              ...params,
              pageParam: nextPageParam,
              limit: params?.limit || PAGE_SIZE,
            }),
          initialPageParam: nextPageParam,
        });

        if (currentPage?.hasMore) {
          queryClient.prefetchInfiniteQuery({
            queryKey: ['opportunities', params],
            queryFn: () =>
              getOpportunities({
                ...params,
                pageParam: nextPageParam + 1,
                limit: params?.limit || PAGE_SIZE,
              }),
            initialPageParam: nextPageParam + 1,
          });
        }
      }
    }
  }, [data?.pages, hasNextPage, isFetchingNextPage, params, queryClient]);

  const opportunities = useMemo(() => {
    if (!data?.pages) return [];

    const totalLength = data.pages.reduce((sum, page) => sum + page.items.length, 0);
    const result = new Array(totalLength);

    let index = 0;
    for (const page of data.pages) {
      for (const item of page.items) {
        result[index++] = item;
      }
    }

    return result;
  }, [data?.pages]);

  const total = useMemo(() => data?.pages[0]?.total ?? 0, [data?.pages]);

  const typeDistribution = useMemo(() => {
    return opportunities.reduce(
      (acc, opp) => {
        acc[opp.type] = (acc[opp.type] || 0) + 1;
        return acc;
      },
      { bank: 0, credit_card: 0, brokerage: 0 }
    );
  }, [opportunities]);

  const createMutation = useMutation({
    mutationKey: ['opportunities'],
    mutationFn: createOpportunity,
    onSuccess: (newOpportunity) => {
      queryClient.setQueryData<InfiniteData<OpportunitiesResponse>>(
        ['opportunities', params],
        (old) => {
          if (!old)
            return {
              pages: [
                { items: [newOpportunity], total: 1, hasMore: false, nextPage: null },
              ],
              pageParams: [1],
            };
          return {
            ...old,
            pages: [
              {
                ...old.pages[0],
                items: [newOpportunity, ...old.pages[0].items],
                total: old.pages[0].total + 1,
              },
              ...old.pages.slice(1),
            ],
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateOpportunity,
    onSuccess: (updatedOpportunity) => {
      if (!isFirestoreOpportunity(updatedOpportunity)) return;
      queryClient.setQueryData<FirestoreOpportunity[]>(
        ['opportunities', params],
        (old) => {
          return old
            ? old.map((opp) =>
                opp.id === updatedOpportunity.id ? updatedOpportunity : opp
              )
            : [];
        }
      );
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({
        queryKey: ['opportunity', updatedOpportunity.id],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOpportunity,
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['opportunities', params] });
      await queryClient.cancelQueries({ queryKey: ['opportunity', deletedId] });

      const previousOpportunities = queryClient.getQueryData<FirestoreOpportunity[]>([
        'opportunities',
        params,
      ]);

      queryClient.setQueryData<FirestoreOpportunity[]>(
        ['opportunities', params],
        (old) => {
          return old ? old.filter((opp) => opp.id !== deletedId) : [];
        }
      );

      queryClient.setQueryData(['opportunity', deletedId], null);

      return { previousOpportunities };
    },
    onError: (error, deletedId, context) => {
      if (context?.previousOpportunities) {
        queryClient.setQueryData(
          ['opportunities', params],
          context.previousOpportunities
        );
      }
      console.error('Error deleting opportunity:', error);
    },
    onSettled: (_, __, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.removeQueries({ queryKey: ['opportunity', deletedId] });
    },
  });

  return {
    opportunities,
    total,
    typeDistribution,
    isLoading: status === 'pending',
    error: error as Error | null,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    createOpportunity: createMutation.mutate,
    updateOpportunity: updateMutation.mutate,
    deleteOpportunity: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
}

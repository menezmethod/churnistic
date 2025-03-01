import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState, useEffect, useCallback, useTransition, useRef } from 'react';
import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { useDebounce } from 'use-debounce';

import { supabase } from '@/lib/supabase/client';
import { Opportunity } from '@/types/opportunity';

const PAGE_SIZE = 20;
const RECONNECT_DELAY = 2000; // 2 seconds delay for reconnection attempts
const MAX_RECONNECT_ATTEMPTS = 5;

// Helper function to handle API responses
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

// Check network status
const isOnline = (): boolean => {
  return typeof navigator !== 'undefined' && navigator.onLine;
};

// Enhanced getOpportunities function with cursor-based pagination
const getOpportunities = async ({
  cursor = null,
  limit = PAGE_SIZE,
  searchTerm = '',
  type = null,
  sortBy = 'value',
  sortDirection = 'desc',
  status = 'approved,staged,pending',
  supabaseClient,
}: {
  cursor?: string | null;
  limit?: number;
  searchTerm?: string;
  type?: string | null;
  sortBy?: 'value' | 'name' | 'type' | 'date' | null;
  sortDirection?: 'asc' | 'desc';
  status?: string;
  supabaseClient: SupabaseClient;
}): Promise<{
  items: Opportunity[];
  nextCursor: string | null;
  total: number;
  hasMore: boolean;
}> => {
  // Check if we're online
  if (!isOnline()) {
    throw new Error('You are currently offline. Please check your connection and try again.');
  }

  console.log('Fetching items with params:', {
    cursor,
    limit,
    searchTerm,
    type,
    sortBy,
    sortDirection,
    status,
  });

  try {
    // Get table info to check column names
    const { data: tableInfo, error: tableInfoError } = await supabaseClient
      .from('opportunities')
      .select('*')
      .limit(1);
    
    if (tableInfoError) {
      console.error('Error fetching table info:', tableInfoError);
    } else {
      console.log('Table columns:', tableInfo && tableInfo.length > 0 ? Object.keys(tableInfo[0]) : 'No data');
    }

    // Build the query
    let query = supabaseClient
      .from('opportunities')
      .select('*', { count: 'exact' })
      .limit(limit);

    // Add cursor-based pagination
    if (cursor) {
      // Map sortBy to the actual column name
      let sortColumn: string = sortBy === 'date' ? 'created_at' : sortBy || 'created_at';
      
      // Determine the comparison operator based on sort direction
      const operator = sortDirection === 'asc' ? 'gt' : 'lt';
      
      // Add the cursor filter
      query = query.filter(sortColumn, operator, cursor);
    }

    // Add filters
    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (status) {
      const statusArray = status.split(',');
      query = query.in('status', statusArray);
    }

    // Add sorting - handle both camelCase and snake_case column names
    if (sortBy) {
      // Check if we need to map the sortBy field to a different column name
      let sortColumn: string = sortBy;
      if (sortBy === 'date') {
        // Try both camelCase and snake_case versions
        sortColumn = tableInfo && tableInfo.length > 0 && 'createdat' in tableInfo[0] 
          ? 'createdat' 
          : 'created_at';
      }
      
      query = query.order(sortColumn, { ascending: sortDirection === 'asc' });
    }

    const { data: items, count, error } = await query;

    if (error) {
      console.error('Error fetching opportunities:', error);
      throw new Error(`Failed to fetch opportunities: ${error.message}`);
    }

    if (!items) {
      console.error('No items returned from query');
      throw new Error('No items returned from query');
    }

    console.log(`Fetched ${items.length} opportunities out of ${count} total`);
    
    // Determine the next cursor value (value of the sort column from the last item)
    let nextCursor: string | null = null;
    if (items.length > 0) {
      const lastItem = items[items.length - 1];
      nextCursor = lastItem[sortBy === 'date' ? 'created_at' : (sortBy || 'created_at')];
    }

    const hasMore = items.length === limit;

    return {
      items: items || [],
      nextCursor,
      total: count || 0,
      hasMore,
    };
  } catch (error) {
    console.error('Error in getOpportunities:', error);
    throw error;
  }
};

const createOpportunity = async (
  data: Omit<Opportunity, 'id'>,
  supabaseClient: SupabaseClient
): Promise<Opportunity> => {
  if (!isOnline()) {
    throw new Error('You are currently offline. Please check your connection and try again.');
  }

  const { data: opportunity, error } = await supabaseClient
    .from('opportunities')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error('Error creating opportunity:', error);
    throw error;
  }

  return opportunity;
};

const updateOpportunity = async (
  params: {
    id: string;
    data: Partial<Opportunity>;
  },
  supabaseClient: SupabaseClient
): Promise<Opportunity> => {
  if (!isOnline()) {
    throw new Error('You are currently offline. Please check your connection and try again.');
  }

  const { id, data } = params;

  const { data: opportunity, error } = await supabaseClient
    .from('opportunities')
    .update({
      ...data,
      metadata: {
        ...data.metadata,
        updated_at: new Date().toISOString(),
      },
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating opportunity:', error);
    throw error;
  }

  return opportunity;
};

const deleteOpportunity = async (id: string, supabaseClient: SupabaseClient): Promise<void> => {
  if (!isOnline()) {
    throw new Error('You are currently offline. Please check your connection and try again.');
  }

  const { error } = await supabaseClient.from('opportunities').delete().eq('id', id);

  if (error) {
    console.error('Error deleting opportunity:', error);
    throw error;
  }
};

interface OpportunitiesResponse {
  items: Opportunity[];
  nextCursor: string | null;
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

export function useOpportunities(initialParams?: Partial<OpportunitiesParams>) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  // Use the supabase client directly
  const supabaseClient = supabase;

  // Refs for subscription and reconnection
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(!isOnline());

  // Initialize filters from URL or initial params
  const [filters, setFilters] = useState<OpportunitiesParams>({
    searchTerm: searchParams.get('search') || initialParams?.searchTerm || '',
    type: searchParams.get('type') || initialParams?.type || null,
    sortBy: (searchParams.get('sortBy') as OpportunitiesParams['sortBy']) || initialParams?.sortBy || 'value',
    sortDirection: (searchParams.get('sortDirection') as 'asc' | 'desc') || initialParams?.sortDirection || 'desc',
    status: searchParams.get('status') || initialParams?.status || 'approved,staged,pending',
    limit: initialParams?.limit || PAGE_SIZE,
  });

  // Debounce search term to avoid excessive API calls
  const [debouncedSearchTerm] = useDebounce(filters.searchTerm, 500);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      console.log('Back online, refetching data...');
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      setupRealtimeSubscription(); // Reconnect when back online
    };

    const handleOffline = () => {
      setIsOffline(true);
      console.log('Network connection lost');
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        setIsSubscribed(false);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queryClient]);

  // Sync URL with filters
  useEffect(() => {
    startTransition(() => {
      const params = new URLSearchParams();
      
      if (filters.searchTerm) params.set('search', filters.searchTerm);
      if (filters.type) params.set('type', filters.type);
      if (filters.sortBy) params.set('sortBy', filters.sortBy);
      if (filters.sortDirection) params.set('sortDirection', filters.sortDirection);
      if (filters.status) params.set('status', filters.status);
      
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      router.replace(newUrl, { scroll: false });
    });
  }, [filters, router]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<OpportunitiesParams>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Invalidate query when filters change
    queryClient.invalidateQueries({ queryKey: ['opportunities'] });
  }, [queryClient]);

  // Reset filters
  const resetFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      type: null,
      sortBy: 'value',
      sortDirection: 'desc',
      status: 'approved,staged,pending',
      limit: PAGE_SIZE,
    });
    queryClient.invalidateQueries({ queryKey: ['opportunities'] });
  }, [queryClient]);

  // Use the debounced search term for the query
  const queryParams = useMemo(() => ({
    ...filters,
    searchTerm: debouncedSearchTerm,
  }), [filters, debouncedSearchTerm]);

  // Setup real-time subscription with reconnection logic
  const setupRealtimeSubscription = useCallback(() => {
    if (isOffline || isSubscribed) return;

    try {
      console.log('Setting up real-time subscription for opportunities');
      
      // Clean up any existing subscription
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }

      const subscription = supabaseClient
        .channel('opportunities-changes')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'opportunities' 
          }, 
          (payload: any) => {
            console.log('Real-time update received:', payload);
            
            // Handle different event types with precision
            if (payload.eventType === 'INSERT') {
              // Check if the new item should be in our current view based on filters
              const newItem = payload.new as Opportunity;
              queryClient.invalidateQueries({ queryKey: ['opportunities'] });
              queryClient.invalidateQueries({ queryKey: ['opportunity', newItem.id] });
            } 
            else if (payload.eventType === 'UPDATE') {
              // Update the specific item in the cache and the list if present
              const updatedItem = payload.new as Opportunity;
              
              // Update in individual item cache
              queryClient.setQueryData(['opportunity', updatedItem.id], updatedItem);
              
              // Update in list cache if present
              queryClient.setQueriesData<InfiniteData<OpportunitiesResponse>>(
                { queryKey: ['opportunities'] },
                (oldData) => {
                  if (!oldData) return oldData;
                  
                  return {
                    ...oldData,
                    pages: oldData.pages.map(page => ({
                      ...page,
                      items: page.items.map(item => 
                        item.id === updatedItem.id ? { ...item, ...updatedItem } : item
                      ),
                    })),
                  };
                }
              );
            } 
            else if (payload.eventType === 'DELETE') {
              // Remove the item from the cache
              const deletedId = payload.old.id;
              
              // Remove from individual cache
              queryClient.removeQueries({ queryKey: ['opportunity', deletedId] });
              
              // Remove from list cache if present
              queryClient.setQueriesData<InfiniteData<OpportunitiesResponse>>(
                { queryKey: ['opportunities'] },
                (oldData) => {
                  if (!oldData) return oldData;
                  
                  return {
                    ...oldData,
                    pages: oldData.pages.map(page => ({
                      ...page,
                      items: page.items.filter(item => item.id !== deletedId),
                      total: page.total > 0 ? page.total - 1 : 0,
                    })),
                  };
                }
              );
            }
          }
        )
        .subscribe((status: any) => {
          console.log('Subscription status:', status);
          
          if (status === 'SUBSCRIBED') {
            setIsSubscribed(true);
            reconnectAttemptsRef.current = 0;
          } else if (status === 'CHANNEL_ERROR') {
            handleSubscriptionError(new Error('Channel error occurred'));
          }
        });

      subscriptionRef.current = subscription;
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
      handleSubscriptionError(error instanceof Error ? error : new Error('Unknown subscription error'));
    }
  }, [queryClient, supabaseClient, isOffline, isSubscribed]);

  // Handle subscription errors and reconnection
  const handleSubscriptionError = useCallback((error: Error) => {
    console.error('Subscription error:', error);
    setIsSubscribed(false);
    
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    
    if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS && !isOffline) {
      console.log(`Attempting to reconnect (${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})...`);
      
      setTimeout(() => {
        reconnectAttemptsRef.current += 1;
        setupRealtimeSubscription();
      }, RECONNECT_DELAY);
    } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error(`Failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts`);
    }
  }, [setupRealtimeSubscription, isOffline]);

  // Initialize subscription
  useEffect(() => {
    setupRealtimeSubscription();
    
    return () => {
      if (subscriptionRef.current) {
        console.log('Cleaning up real-time subscription');
        subscriptionRef.current.unsubscribe();
        setIsSubscribed(false);
      }
    };
  }, [setupRealtimeSubscription]);

  // Main query with cursor-based pagination
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    status, 
    error, 
    refetch,
    isLoading,
    isFetching,
  } = useInfiniteQuery<
    OpportunitiesResponse,
    Error,
    InfiniteData<OpportunitiesResponse>,
    [string, typeof queryParams],
    string | null
  >({
    queryKey: ['opportunities', queryParams],
    queryFn: async ({ pageParam }) => getOpportunities({
      ...queryParams,
      cursor: pageParam,
      supabaseClient,
    }),
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : null,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: true,
    retry: (failureCount, error) => {
      // Don't retry if we're offline
      if (isOffline) return false;
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    // Customize error handling
    meta: {
      errorMessage: 'Failed to load opportunities',
    },
  });

  // Mutations with optimistic updates
  const createMutation = useMutation({
    mutationFn: (newOpportunity: Omit<Opportunity, 'id'>) =>
      createOpportunity(newOpportunity, supabaseClient),
    onMutate: async (newOpportunity) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['opportunities'] });
      
      // Create an optimistic opportunity with a temporary ID
      const optimisticOpportunity = {
        id: `temp-${Date.now()}`,
        ...newOpportunity,
        // TypeScript doesn't know these fields exist on Opportunity, but they do in the database
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as unknown as Opportunity;
      
      // Add the optimistic opportunity to the cache
      queryClient.setQueryData<InfiniteData<OpportunitiesResponse>>(
        ['opportunities', queryParams],
        (old) => {
          if (!old) return old;
          
          const newPages = [...old.pages];
          newPages[0] = {
            ...newPages[0],
            items: [optimisticOpportunity, ...newPages[0].items],
            total: newPages[0].total + 1,
          };
          
          return {
            ...old,
            pages: newPages,
          };
        }
      );
      
      return { optimisticOpportunity };
    },
    onError: (err, newOpportunity, context) => {
      // Revert the optimistic update
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      console.error('Error creating opportunity:', err);
    },
    onSuccess: (data) => {
      // Update the cache with the actual data
      queryClient.setQueryData(['opportunity', data.id], data);
      // Then invalidate the list query to ensure it's up to date
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (params: { id: string; data: Partial<Opportunity> }) =>
      updateOpportunity(params, supabaseClient),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['opportunities'] });
      await queryClient.cancelQueries({ queryKey: ['opportunity', id] });
      
      // Get the current opportunity data
      const previousOpportunity = queryClient.getQueryData<Opportunity>(['opportunity', id]);
      
      // Get the current list data
      const previousData = queryClient.getQueryData<InfiniteData<OpportunitiesResponse>>(
        ['opportunities', queryParams]
      );
      
      // Update the individual opportunity in the cache
      if (previousOpportunity) {
        queryClient.setQueryData<Opportunity>(
          ['opportunity', id],
          { ...previousOpportunity, ...data, updated_at: new Date().toISOString() } as any
        );
      }
      
      // Update the opportunity in the list cache
      queryClient.setQueryData<InfiniteData<OpportunitiesResponse>>(
        ['opportunities', queryParams],
        (old) => {
          if (!old) return old;
          
          const newPages = old.pages.map(page => ({
            ...page,
            items: page.items.map(item => 
              item.id === id 
                ? { ...item, ...data, updated_at: new Date().toISOString() } as Opportunity
                : item
            ),
          }));
          
          return {
            ...old,
            pages: newPages,
          };
        }
      );
      
      return { previousOpportunity, previousData };
    },
    onError: (err, { id }, context) => {
      // Revert the individual opportunity update
      if (context?.previousOpportunity) {
        queryClient.setQueryData(['opportunity', id], context.previousOpportunity);
      }
      
      // Revert the list update
      if (context?.previousData) {
        queryClient.setQueryData(
          ['opportunities', queryParams],
          context.previousData
        );
      }
      
      console.error(`Error updating opportunity ${id}:`, err);
    },
    onSuccess: (updatedOpportunity) => {
      // Update the cache with the actual data
      queryClient.setQueryData(['opportunity', updatedOpportunity.id], updatedOpportunity);
      // Then invalidate the list query to ensure it's up to date
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOpportunity(id, supabaseClient),
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['opportunities'] });
      await queryClient.cancelQueries({ queryKey: ['opportunity', id] });
      
      // Get the current data
      const previousData = queryClient.getQueryData<InfiniteData<OpportunitiesResponse>>(
        ['opportunities', queryParams]
      );
      
      // Get the opportunity being deleted (for potential undo)
      const deletedOpportunity = queryClient.getQueryData<Opportunity>(['opportunity', id]);
      
      // Remove the opportunity from individual cache
      queryClient.removeQueries({ queryKey: ['opportunity', id] });
      
      // Remove the opportunity from the list cache
      queryClient.setQueryData<InfiniteData<OpportunitiesResponse>>(
        ['opportunities', queryParams],
        (old) => {
          if (!old) return old;
          
          const newPages = old.pages.map(page => ({
            ...page,
            items: page.items.filter(item => item.id !== id),
            total: page.total - 1,
          }));
          
          return {
            ...old,
            pages: newPages,
          };
        }
      );
      
      return { previousData, deletedOpportunity };
    },
    onError: (err, id, context) => {
      // Restore the opportunity to individual cache if available
      if (context?.deletedOpportunity) {
        queryClient.setQueryData(['opportunity', id], context.deletedOpportunity);
      }
      
      // Restore the list data
      if (context?.previousData) {
        queryClient.setQueryData(
          ['opportunities', queryParams],
          context.previousData
        );
      }
      
      console.error(`Error deleting opportunity ${id}:`, err);
    },
    onSuccess: (_, id) => {
      // Confirm the deletion by invalidating queries
      queryClient.removeQueries({ queryKey: ['opportunity', id] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  // Flatten the opportunities from all pages
  const opportunities = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  const total = useMemo(() => data?.pages[0]?.total ?? 0, [data]);

  return {
    // Data
    opportunities,
    total,
    hasNextPage,
    
    // Pagination
    fetchNextPage,
    isFetchingNextPage,
    
    // Status
    status,
    error,
    isLoading,
    isFetching,
    isPending,
    isOffline,
    isSubscribed,
    
    // Actions
    refetch,
    createOpportunity: createMutation.mutate,
    updateOpportunity: updateMutation.mutate,
    deleteOpportunity: deleteMutation.mutate,
    
    // Mutation status
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Filters
    filters,
    updateFilters,
    resetFilters,
    
    // Force reconnection to real-time updates
    reconnect: () => {
      reconnectAttemptsRef.current = 0;
      setupRealtimeSubscription();
    },
  };
}

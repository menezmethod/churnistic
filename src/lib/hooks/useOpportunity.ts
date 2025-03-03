'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { supabase } from '@/lib/supabase/client';
import { Opportunity } from '@/types/opportunity';

const API_BASE = '/api/opportunities';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    try {
      const error = await response.json();
      throw new Error(error.message || `Request failed with status ${response.status}`);
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      throw e;
    }
  }
  return response.json();
}

const getOpportunityById = async (id: string): Promise<Opportunity> => {
  try {
    // First try to get from Supabase directly using @supabase/ssr client
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', id)
      .single();

    if (data && !error) {
      return data as Opportunity;
    }

    if (error) {
      console.error(`Error fetching opportunity ${id} from Supabase:`, error);
    }

    // Fall back to API if direct query fails
    console.log(`Falling back to API for opportunity ${id}`);
    const response = await fetch(`${API_BASE}/${id}`);
    return handleResponse<Opportunity>(response);
  } catch (error) {
    console.error(`Error in getOpportunityById for ${id}:`, error);
    throw error;
  }
};

export function useOpportunity(id: string) {
  const queryClient = useQueryClient();

  // Base query for the opportunity
  const query = useQuery<Opportunity>({
    queryKey: ['opportunity', id],
    queryFn: () => getOpportunityById(id),
    enabled: !!id,
    gcTime: 1000 * 60 * 5, // Cache for 5 minutes after becoming unused
    staleTime: 1000 * 60 * 1, // Consider data fresh for 1 minute
  });

  // Set up realtime subscription for the opportunity
  useEffect(() => {
    if (!id) return;

    // Setup the real-time subscription
    console.log(`Setting up real-time subscription for opportunity ${id}`);
    const subscription = supabase
      .channel(`opportunity-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for inserts, updates, and deletes
          schema: 'public',
          table: 'opportunities',
          filter: `id=eq.${id}`,
        },
        (payload: { eventType: string; new: Opportunity }) => {
          console.log(`Received real-time update for opportunity ${id}:`, payload);

          // Handle different types of changes
          if (payload.eventType === 'DELETE') {
            // If the opportunity was deleted, remove it from cache
            queryClient.removeQueries({ queryKey: ['opportunity', id] });
          } else {
            // For updates or inserts, update the cache with the new data
            const updatedOpportunity = payload.new as Opportunity;

            // Merge with existing data to preserve any fields not included in the update
            const existingData = queryClient.getQueryData<Opportunity>([
              'opportunity',
              id,
            ]);
            if (existingData) {
              queryClient.setQueryData<Opportunity>(['opportunity', id], {
                ...existingData,
                ...updatedOpportunity,
              });
            } else {
              // If no existing data, just set the new data
              queryClient.setQueryData(['opportunity', id], updatedOpportunity);
            }
          }
        }
      )
      .subscribe();

    // Clean up the subscription when the component unmounts
    return () => {
      console.log(`Cleaning up real-time subscription for opportunity ${id}`);
      subscription.unsubscribe();
    };
  }, [id, queryClient]);

  return query;
}

export function useUpdateOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Opportunity> }) => {
      const { data: updatedOpportunity, error } = await supabase
        .from('opportunities')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedOpportunity as Opportunity;
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['opportunity', id] });

      // Snapshot the previous value
      const previousOpportunity = queryClient.getQueryData<Opportunity>([
        'opportunity',
        id,
      ]);

      // Optimistically update to the new value
      if (previousOpportunity) {
        queryClient.setQueryData<Opportunity>(['opportunity', id], {
          ...previousOpportunity,
          ...data,
        });
      }

      return { previousOpportunity };
    },
    onError: (err, { id }, context) => {
      console.error(`Error updating opportunity ${id}:`, err);
      // Revert back to the previous state if available
      if (context?.previousOpportunity) {
        queryClient.setQueryData(['opportunity', id], context.previousOpportunity);
      }
    },
    onSuccess: (data, { id }) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['opportunity', id] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });
}

export function useDeleteOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('opportunities').delete().eq('id', id);

      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['opportunity', id] });
      await queryClient.cancelQueries({ queryKey: ['opportunities'] });

      // Snapshot the previous opportunity
      const previousOpportunity = queryClient.getQueryData<Opportunity>([
        'opportunity',
        id,
      ]);

      // Snapshot the previous opportunities list
      const previousOpportunities = queryClient.getQueryData<Opportunity[]>([
        'opportunities',
      ]);

      // Optimistically remove from cache
      if (previousOpportunity) {
        queryClient.removeQueries({ queryKey: ['opportunity', id] });
      }

      // Optimistically remove from list if it exists
      if (previousOpportunities) {
        queryClient.setQueryData(
          ['opportunities'],
          previousOpportunities.filter((opp) => opp.id !== id)
        );
      }

      return { previousOpportunity, previousOpportunities };
    },
    onError: (err, id, context) => {
      console.error(`Error deleting opportunity ${id}:`, err);

      // Restore the opportunity if available
      if (context?.previousOpportunity) {
        queryClient.setQueryData(['opportunity', id], context.previousOpportunity);
      }

      // Restore the opportunities list if available
      if (context?.previousOpportunities) {
        queryClient.setQueryData(['opportunities'], context.previousOpportunities);
      }
    },
    onSuccess: (id) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['opportunity', id] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { MutationFunction, UseMutationOptions } from '@tanstack/react-query';
import { merge, cloneDeep } from 'lodash';
import { toast } from 'sonner';

import { FirestoreOpportunity } from '@/types/opportunity';

import { opportunityKeys } from '../query/keys';

type MutationContext = {
  prev: FirestoreOpportunity | undefined;
};

export const useUpdateOpportunity = (
  options?: UseMutationOptions<
    FirestoreOpportunity,
    Error,
    { id: string; data: Partial<FirestoreOpportunity> },
    MutationContext
  >
) => {
  const queryClient = useQueryClient();

  const mutationFn: MutationFunction<
    FirestoreOpportunity,
    { id: string; data: Partial<FirestoreOpportunity> }
  > = async ({ id, data }) => {
    console.log(`Making API request to update opportunity ${id}:`, data);
    
    // DEBUG: Log the exact structure being sent to the server
    console.log(`Request payload for opportunity ${id}:`, JSON.stringify(data, null, 2));
    
    const res = await fetch(`/api/opportunities/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Error updating opportunity ${id}:`, errorText);
      throw new Error(errorText || 'Failed to update opportunity');
    }
    
    const responseData = await res.json();
    console.log(`Successful update for opportunity ${id}:`, responseData);
    
    // DEBUG: Verify response structure matches expectations
    console.log(`Response structure check for ${id}:`, {
      hasDetailsObject: !!responseData.details,
      detailsKeys: responseData.details ? Object.keys(responseData.details) : [],
      responseDataKeys: Object.keys(responseData)
    });
    
    return responseData;
  };

  return useMutation({
    mutationFn,
    onMutate: async ({ id, data }) => {
      console.log(`Starting mutation for opportunity ${id}:`, data);
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: opportunityKeys.detail(id) });

      // Snapshot the previous value
      const prev = queryClient.getQueryData<FirestoreOpportunity>(
        opportunityKeys.detail(id)
      );
      
      console.log(`Current cache state for opportunity ${id}:`, prev);

      // Optimistically update the cache using deep merge
      if (prev) {
        // Create a deep clone of prev to avoid reference issues
        const prevClone = cloneDeep(prev);
        
        const updatedMetadata = {
          ...prevClone.metadata,
          ...data.metadata,
          updated_at: new Date().toISOString(),
        };
        
        // DEBUG: Log the details object before merging
        if (prevClone.details && data.details) {
          console.log(`Details object comparison for ${id}:`, {
            prevDetails: prevClone.details,
            updateDetails: data.details,
            prevDetailsKeys: Object.keys(prevClone.details),
            updateDetailsKeys: Object.keys(data.details)
          });
        }
        
        // Create a new object with deep merged data to preserve nested fields
        const updatedData = merge({}, prevClone, data);
        
        // Ensure metadata is properly updated
        updatedData.metadata = updatedMetadata;
        
        console.log(`Optimistically updating cache for opportunity ${id}:`, {
          previous: prevClone,
          updated: updatedData,
          mergedFields: Object.keys(data)
        });
        
        // DEBUG: Verify nested objects were properly merged
        if (prevClone.details && updatedData.details) {
          console.log(`Details merge verification for ${id}:`, {
            prevDetailsKeys: Object.keys(prevClone.details),
            updatedDetailsKeys: Object.keys(updatedData.details),
            missingKeys: Object.keys(prevClone.details).filter(
              key => !Object.keys(updatedData.details).includes(key)
            )
          });
        }
        
        queryClient.setQueryData<FirestoreOpportunity>(
          opportunityKeys.detail(id),
          updatedData
        );
        
        // Verify the update was successful
        const afterUpdate = queryClient.getQueryData<FirestoreOpportunity>(
          opportunityKeys.detail(id)
        );
        
        console.log(`Cache after optimistic update for opportunity ${id}:`, afterUpdate);
      } else {
        console.log(`No existing cache data found for opportunity ${id}`);
      }

      // Return context with the prev value
      return { prev };
    },
    onError: (err, { id }, context) => {
      console.error(`Error in mutation for opportunity ${id}:`, err);
      
      // Rollback on error
      if (context?.prev) {
        console.log(`Rolling back to previous state for opportunity ${id}:`, context.prev);
        queryClient.setQueryData(opportunityKeys.detail(id), context.prev);
      }
      toast.error('Failed to update opportunity: ' + err.message);
    },
    onSuccess: (data, { id }) => {
      console.log(`Successfully updated opportunity ${id}:`, data);
      
      // DEBUG: Verify the server response structure is as expected
      console.log(`Server response structure check for ${id}:`, {
        hasDetailsObject: !!data.details,
        detailsKeys: data.details ? Object.keys(data.details) : [],
        dataKeys: Object.keys(data)
      });
      
      // Update all related queries
      queryClient.invalidateQueries({ queryKey: opportunityKeys.all });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.detail(id) });
      toast.success('Opportunity updated successfully');
    },
    retry: 2,
    ...options,
  });
};

// export * from './useUpdateOpportunity'; // If using barrel file
// OR directly export the hook if not

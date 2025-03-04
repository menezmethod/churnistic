import { useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

import { useUpdateOpportunity } from '@/lib/hooks/useUpdateOpportunity';
import { opportunityKeys } from '@/lib/query/keys';
import { FirestoreOpportunity, OfferType } from '@/types/opportunity';

export type QuickStatsField = 'value' | 'type' | 'bank';

export interface QuickStatsState {
  isLoading: boolean;
  updatingField: QuickStatsField | null;
}

/**
 * Hook to manage updates to Quick Stats section fields
 * Handles optimistic updates, error handling, and loading states
 */
export const useQuickStats = (opportunityId: string) => {
  const queryClient = useQueryClient();
  const { mutateAsync: updateOpportunity } = useUpdateOpportunity();
  const [state, setState] = useState<QuickStatsState>({
    isLoading: false,
    updatingField: null,
  });

  // Debug utility function
  const logAction = useCallback(
    (action: string, details: Record<string, unknown>) => {
      console.log(`[useQuickStats] ${action}:`, {
        opportunityId,
        ...details,
      });
    },
    [opportunityId]
  );

  /**
   * Update the monetary value field (number field)
   */
  const updateValue = useCallback(
    async (newValue: string | number) => {
      // Convert to number - handle both string and number inputs
      const numericValue = typeof newValue === 'string' ? parseFloat(newValue) : newValue;

      // Validate the value
      if (isNaN(numericValue)) {
        toast.error('Invalid value: Must be a valid number');
        return;
      }

      logAction('Updating value', { numericValue });

      setState((prev) => ({ ...prev, isLoading: true, updatingField: 'value' }));

      try {
        // Get current opportunity data
        const currentData = queryClient.getQueryData<FirestoreOpportunity>(
          opportunityKeys.detail(opportunityId)
        );

        if (!currentData) {
          throw new Error('No opportunity data found');
        }

        // Create optimistic update
        const optimisticData = {
          ...currentData,
          value: numericValue,
        };

        // Apply optimistic update to cache
        queryClient.setQueryData(opportunityKeys.detail(opportunityId), optimisticData);

        // Send API request
        await updateOpportunity({
          id: opportunityId,
          data: { value: numericValue },
        });

        toast.success('Value updated successfully');
      } catch (error) {
        console.error('Error updating value:', error);
        toast.error('Failed to update value');

        // Revert optimistic update
        queryClient.invalidateQueries({
          queryKey: opportunityKeys.detail(opportunityId),
        });
      } finally {
        setState((prev) => ({ ...prev, isLoading: false, updatingField: null }));
      }
    },
    [opportunityId, queryClient, updateOpportunity, logAction]
  );

  /**
   * Update the type field (select field)
   */
  const updateType = useCallback(
    async (newType: string | number) => {
      // Convert newType to string if it's a number (though this should never happen)
      const typeValue = String(newType);

      // Validate that the type value is one of the allowed OfferType values
      if (!['credit_card', 'bank', 'brokerage'].includes(typeValue)) {
        toast.error(`Invalid type: ${typeValue}`);
        return;
      }

      logAction('Updating type', { typeValue });

      setState((prev) => ({ ...prev, isLoading: true, updatingField: 'type' }));

      try {
        // Get current opportunity data
        const currentData = queryClient.getQueryData<FirestoreOpportunity>(
          opportunityKeys.detail(opportunityId)
        );

        if (!currentData) {
          throw new Error('No opportunity data found');
        }

        // Create optimistic update with proper typing
        const optimisticData = {
          ...currentData,
          type: typeValue as OfferType,
        };

        // Apply optimistic update to cache
        queryClient.setQueryData(opportunityKeys.detail(opportunityId), optimisticData);

        // Send API request with type-safe value
        await updateOpportunity({
          id: opportunityId,
          data: { type: typeValue as OfferType },
        });

        toast.success('Type updated successfully');
      } catch (error) {
        console.error('Error updating type:', error);
        toast.error('Failed to update type');

        // Revert optimistic update
        queryClient.invalidateQueries({
          queryKey: opportunityKeys.detail(opportunityId),
        });
      } finally {
        setState((prev) => ({ ...prev, isLoading: false, updatingField: null }));
      }
    },
    [opportunityId, queryClient, updateOpportunity, logAction]
  );

  /**
   * Update the bank field (text field)
   */
  const updateBank = useCallback(
    async (newBankValue: string | number) => {
      // Convert to string if it's a number
      const bankValue = String(newBankValue);

      logAction('Updating bank', { bankValue });

      setState((prev) => ({ ...prev, isLoading: true, updatingField: 'bank' }));

      try {
        // Get current opportunity data
        const currentData = queryClient.getQueryData<FirestoreOpportunity>(
          opportunityKeys.detail(opportunityId)
        );

        if (!currentData) {
          throw new Error('No opportunity data found');
        }

        // Create optimistic update
        const optimisticData = {
          ...currentData,
          bank: bankValue,
        };

        // Apply optimistic update to cache
        queryClient.setQueryData(opportunityKeys.detail(opportunityId), optimisticData);

        // Send API request
        await updateOpportunity({
          id: opportunityId,
          data: { bank: bankValue },
        });

        toast.success('Bank updated successfully');
      } catch (error) {
        console.error('Error updating bank:', error);
        toast.error('Failed to update bank');

        // Revert optimistic update
        queryClient.invalidateQueries({
          queryKey: opportunityKeys.detail(opportunityId),
        });
      } finally {
        setState((prev) => ({ ...prev, isLoading: false, updatingField: null }));
      }
    },
    [opportunityId, queryClient, updateOpportunity, logAction]
  );

  // Determine which field is currently being updated
  const isUpdating = useCallback(
    (field: QuickStatsField) => {
      return state.isLoading && state.updatingField === field;
    },
    [state.isLoading, state.updatingField]
  );

  return {
    state,
    updateValue,
    updateType,
    updateBank,
    isUpdating,
  };
};

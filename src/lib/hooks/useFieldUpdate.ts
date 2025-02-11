import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { showErrorToast, showSuccessToast } from '@/lib/utils/toast';

interface UseFieldUpdateOptions {
  id: string;
  queryKey: string[];
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useFieldUpdate = ({
  id,
  queryKey,
  onSuccess,
  onError,
}: UseFieldUpdateOptions) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const updateField = async (field: string, value: any) => {
    setIsUpdating(true);

    try {
      // Optimistically update the cache
      const previousData = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        const newData = { ...old };
        const fieldPath = field.split('.');
        let current = newData;
        for (let i = 0; i < fieldPath.length - 1; i++) {
          if (!current[fieldPath[i]]) current[fieldPath[i]] = {};
          current = current[fieldPath[i]];
        }
        current[fieldPath[fieldPath.length - 1]] = value;
        return newData;
      });

      // Make the API call
      const response = await fetch(`/api/opportunities/${id}/update-field`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update field');
      }

      // Show success message and trigger callback
      showSuccessToast('Updated successfully');
      onSuccess?.();

      // Invalidate the query to ensure data consistency
      queryClient.invalidateQueries({ queryKey });
    } catch (error) {
      // Revert the optimistic update
      queryClient.setQueryData(queryKey, previousData);

      // Show error message and trigger callback
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update field';
      showErrorToast(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateField,
    isUpdating,
  };
};

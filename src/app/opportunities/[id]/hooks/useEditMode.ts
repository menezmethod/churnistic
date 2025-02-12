import { useQueryClient } from '@tanstack/react-query';
import { get, set } from 'lodash';
import { useState, useCallback } from 'react';

import { useUpdateOpportunity } from '@/lib/hooks/useUpdateOpportunity';
import { opportunityKeys } from '@/lib/query/keys';
import { FirestoreOpportunity } from '@/types/opportunity';

import type { EditModeState, EditableField } from '../OpportunityDetails.types';

export const useEditMode = (opportunity: FirestoreOpportunity & { id: string }) => {
  const queryClient = useQueryClient();
  const { mutate: updateOpportunity } = useUpdateOpportunity();
  const [editState, setEditState] = useState<EditModeState>({
    isGlobalEditMode: false,
    editingFields: {},
  });

  const toggleGlobalEditMode = useCallback((enabled: boolean) => {
    setEditState((prev: EditModeState) => ({
      ...prev,
      isGlobalEditMode: enabled,
      editingFields: enabled ? prev.editingFields : {},
    }));
  }, []);

  const startFieldEdit = useCallback(
    (fieldKey: string, config: Omit<EditableField, 'isEditing' | 'value'>) => {
      setEditState((prev: EditModeState) => ({
        ...prev,
        editingFields: {
          ...prev.editingFields,
          [fieldKey]: {
            ...config,
            value: get(opportunity, fieldKey) ?? null,
            isEditing: true,
          },
        },
      }));
    },
    [opportunity]
  );

  const cancelFieldEdit = useCallback((fieldKey: string) => {
    setEditState((prev: EditModeState) => ({
      ...prev,
      editingFields: {
        ...prev.editingFields,
        [fieldKey]: {
          ...prev.editingFields[fieldKey],
          isEditing: false,
        },
      },
    }));
  }, []);

  const updateField = useCallback(
    (fieldKey: string, value: string | number | boolean) => {
      // Update local state
      setEditState((prev: EditModeState) => ({
        ...prev,
        editingFields: {
          ...prev.editingFields,
          [fieldKey]: {
            ...prev.editingFields[fieldKey],
            value,
            isEditing: false,
          },
        },
      }));

      // Create updated opportunity object
      const updatedOpportunity = { ...opportunity };
      set(updatedOpportunity, fieldKey, value);

      // Update metadata
      updatedOpportunity.metadata = {
        ...updatedOpportunity.metadata,
        updated_at: new Date().toISOString(),
      };

      // Optimistically update the cache
      queryClient.setQueryData(
        opportunityKeys.detail(opportunity.id),
        updatedOpportunity
      );

      // Send update to server
      const fieldParts = fieldKey.split('.');
      const updateData: Record<string, unknown> = {};
      let currentObj = updateData;

      // Build nested object structure
      for (let i = 0; i < fieldParts.length - 1; i++) {
        currentObj[fieldParts[i]] = {} as Record<string, unknown>;
        currentObj = currentObj[fieldParts[i]] as Record<string, unknown>;
      }
      currentObj[fieldParts[fieldParts.length - 1]] = value;

      updateOpportunity({
        id: opportunity.id,
        data: {
          ...updateData,
          metadata: updatedOpportunity.metadata,
        },
      });
    },
    [opportunity, queryClient, updateOpportunity]
  );

  return {
    editState,
    toggleGlobalEditMode,
    startFieldEdit,
    cancelFieldEdit,
    updateField,
  };
};

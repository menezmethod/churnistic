import { useQueryClient } from '@tanstack/react-query';
import { get, set, merge, cloneDeep } from 'lodash';
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
      console.log(`Starting edit for field: ${fieldKey}`, {
        currentValue: get(opportunity, fieldKey),
        fieldConfig: config
      });
      
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
    console.log(`Cancelling edit for field: ${fieldKey}`);
    
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
      console.log(`Updating field: ${fieldKey}`, {
        oldValue: get(opportunity, fieldKey),
        newValue: value,
        opportunityId: opportunity.id
      });
      
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

      // Create updated opportunity object with deep clone to avoid reference issues
      const updatedOpportunity = cloneDeep(opportunity);
      
      // Log the path structure to ensure proper navigation
      const fieldParts = fieldKey.split('.');
      console.log(`Field path structure: ${fieldParts.join(' > ')}`);
      
      // Set the value in the cloned object
      set(updatedOpportunity, fieldKey, value);

      // Update metadata
      updatedOpportunity.metadata = {
        ...updatedOpportunity.metadata,
        updated_at: new Date().toISOString(),
      };

      // Get current cache state for debugging
      const currentCache = queryClient.getQueryData(opportunityKeys.detail(opportunity.id));
      console.log('Current cache before update:', currentCache);
      
      // Debug: examine the details object before and after the update
      if (fieldKey.startsWith('details')) {
        console.log('Details object comparison:', {
          beforeUpdate: opportunity.details ? {...opportunity.details} : null,
          afterUpdate: updatedOpportunity.details ? {...updatedOpportunity.details} : null,
          detailsPathUpdated: fieldKey
        });
      }

      // Optimistically update the cache with deep merging to prevent losing nested data
      queryClient.setQueryData(
        opportunityKeys.detail(opportunity.id),
        (oldData) => {
          if (!oldData) {
            console.log('No existing data in cache, using updated opportunity directly');
            return updatedOpportunity;
          }
          
          // Create deep clones to avoid reference issues
          const oldClone = cloneDeep(oldData);
          const updateClone = cloneDeep(updatedOpportunity);
          
          // Deep merge to preserve all nested fields
          console.log('Merging data:', { 
            oldData: oldClone, 
            updatedOpportunity: updateClone,
            fieldUpdated: fieldKey
          });
          
          // Check if we're updating a nested field in an object
          const parentPath = fieldParts.slice(0, -1).join('.');
          if (parentPath) {
            const parentObject = get(oldClone, parentPath);
            console.log(`Parent object at ${parentPath}:`, parentObject);
          }
          
          const result = merge({}, oldClone, updateClone);
          
          // Verify the field was updated correctly
          console.log('Field value verification:', {
            oldValue: get(oldClone, fieldKey),
            newValue: get(result, fieldKey),
            updatedCorrectly: get(result, fieldKey) === value
          });
          
          console.log('Merge result:', result);
          return result;
        }
      );

      // Verify cache was updated correctly
      const updatedCache = queryClient.getQueryData(opportunityKeys.detail(opportunity.id));
      console.log('Cache after update:', updatedCache);
      
      // Verify the details object was preserved if relevant
      if (fieldKey.startsWith('details') && updatedCache) {
        console.log('Details object preservation check:', {
          detailsBeforeKeys: opportunity.details ? Object.keys(opportunity.details) : [],
          detailsAfterKeys: get(updatedCache, 'details') ? Object.keys(get(updatedCache, 'details')) : [],
          fieldUpdated: fieldKey
        });
      }

      // Send update to server - structure the update data properly
      const updateData: Record<string, unknown> = {};
      let currentObj = updateData;

      // Build nested object structure
      for (let i = 0; i < fieldParts.length - 1; i++) {
        currentObj[fieldParts[i]] = {} as Record<string, unknown>;
        currentObj = currentObj[fieldParts[i]] as Record<string, unknown>;
      }
      currentObj[fieldParts[fieldParts.length - 1]] = value;

      console.log('Sending update to server:', {
        id: opportunity.id,
        updateData,
        metadata: updatedOpportunity.metadata
      });

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

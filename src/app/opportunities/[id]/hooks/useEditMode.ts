import { useQueryClient } from '@tanstack/react-query';
import { get, set, merge, cloneDeep } from 'lodash';
import { useState, useCallback } from 'react';

import { useUpdateOpportunity } from '@/lib/hooks/useUpdateOpportunity';
import { opportunityKeys } from '@/lib/query/keys';
import { FirestoreOpportunity } from '@/types/opportunity';

import type { EditModeState, EditableField } from '../OpportunityDetails.types';

/**
 * This file uses dynamic property access for updating nested fields in Firestore documents.
 * Type assertions (as DynamicObject) are used to allow bracket notation access
 * for properties that   aren't part of the static type definition.
 */

// Define a type for objects with dynamic string keys
type DynamicObject = Record<string, unknown>;

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
        fieldConfig: config,
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
      // If dealing with a date field, ensure it's in the right format
      const processedValue =
        typeof value === 'string' &&
        value.includes('T') &&
        fieldKey.includes('expiration')
          ? value // The ISO string from DatePicker is already in the correct format
          : value;

      console.log(`Updating field: ${fieldKey}`, {
        oldValue: get(opportunity, fieldKey),
        newValue: processedValue,
        opportunityId: opportunity.id,
      });

      // Update local state
      setEditState((prev: EditModeState) => ({
        ...prev,
        editingFields: {
          ...prev.editingFields,
          [fieldKey]: {
            ...prev.editingFields[fieldKey],
            value: processedValue,
            isEditing: false,
          },
        },
      }));

      // Create updated opportunity object with deep clone to avoid reference issues
      const updatedOpportunity = cloneDeep(opportunity);

      // Log the path structure to ensure proper navigation
      const fieldParts = fieldKey.split('.');
      console.log(`Field path structure: ${fieldParts.join(' > ')}`);

      // For empty fields, make sure parent objects exist
      let currentObj = updatedOpportunity as unknown as DynamicObject;
      for (let i = 0; i < fieldParts.length - 1; i++) {
        if (!currentObj[fieldParts[i]]) {
          currentObj[fieldParts[i]] = {};
        }
        currentObj = currentObj[fieldParts[i]] as DynamicObject;
      }

      // Set the value in the cloned object
      set(updatedOpportunity, fieldKey, processedValue);

      // Update metadata
      updatedOpportunity.metadata = {
        ...updatedOpportunity.metadata,
        updated_at: new Date().toISOString(),
      };

      // Get current cache state for debugging
      const currentCache = queryClient.getQueryData(
        opportunityKeys.detail(opportunity.id)
      );
      console.log('Current cache before update:', currentCache);

      // Debug: examine the details object before and after the update
      if (fieldKey.startsWith('details')) {
        console.log('Details object comparison:', {
          beforeUpdate: opportunity.details ? { ...opportunity.details } : null,
          afterUpdate: updatedOpportunity.details
            ? { ...updatedOpportunity.details }
            : null,
          detailsPathUpdated: fieldKey,
        });
      }

      // Optimistically update the cache with deep merging to prevent losing nested data
      queryClient.setQueryData(
        opportunityKeys.detail(opportunity.id),
        (oldData: (FirestoreOpportunity & { id: string }) | undefined) => {
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
            fieldUpdated: fieldKey,
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
            updatedCorrectly: get(result, fieldKey) === processedValue,
          });

          console.log('Merge result:', result);
          return result;
        }
      );

      // Verify cache was updated correctly
      const updatedCache = queryClient.getQueryData(
        opportunityKeys.detail(opportunity.id)
      );
      console.log('Cache after update:', updatedCache);

      // Verify the details object was preserved if relevant
      if (fieldKey.startsWith('details') && updatedCache) {
        const updatedCacheTyped = updatedCache as FirestoreOpportunity & { id: string };
        console.log('Details object preservation check:', {
          detailsBeforeKeys: opportunity.details ? Object.keys(opportunity.details) : [],
          detailsAfterKeys: updatedCacheTyped.details
            ? Object.keys(updatedCacheTyped.details)
            : [],
          fieldUpdated: fieldKey,
        });
      }

      // Send update to server - structure the update data properly
      const updateData: Record<string, unknown> = {};

      // Special handling for nested fields - ensure all parent objects exist
      if (fieldParts.length > 1) {
        let currentObj = updateData as unknown as DynamicObject;

        // Build nested object structure
        for (let i = 0; i < fieldParts.length - 1; i++) {
          currentObj[fieldParts[i]] = {} as Record<string, unknown>;
          currentObj = currentObj[fieldParts[i]] as DynamicObject;
        }

        // Set the final value
        currentObj[fieldParts[fieldParts.length - 1]] = processedValue;
      } else {
        // Simple non-nested field
        updateData[fieldKey] = processedValue;
      }

      // Add metadata update
      updateData.metadata = updatedOpportunity.metadata;

      console.log('Sending update to server:', {
        id: opportunity.id,
        updateData,
        metadata: updatedOpportunity.metadata,
      });

      updateOpportunity({
        id: opportunity.id,
        data: updateData,
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

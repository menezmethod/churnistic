import { get, set } from 'lodash';
import { useState, useCallback } from 'react';

import { FirestoreOpportunity } from '@/types/opportunity';

import type { EditModeState, EditableField } from '../OpportunityDetails.types';

export const useEditMode = (opportunity: FirestoreOpportunity) => {
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

      const updatedOpportunity = { ...opportunity };
      set(updatedOpportunity, fieldKey, value);

      console.log('Updating field:', fieldKey, 'with value:', value);
      console.log('Updated opportunity:', updatedOpportunity);
    },
    [opportunity]
  );

  return {
    editState,
    toggleGlobalEditMode,
    startFieldEdit,
    cancelFieldEdit,
    updateField,
  };
};

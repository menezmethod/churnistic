import { useQueryClient } from '@tanstack/react-query';
import { set } from 'lodash';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/lib/auth/AuthContext';
import { useOpportunities } from '@/lib/hooks/useOpportunities';
import { useOpportunity } from '@/lib/hooks/useOpportunity';
import { useUpdateOpportunity } from '@/lib/hooks/useUpdateOpportunity';
import { opportunityKeys } from '@/lib/query/keys';
import { FirestoreOpportunity } from '@/types/opportunity';

import { OpportunityState } from './OpportunityDetails.types';

type UpdateData = {
  [key: string]: unknown;
  metadata?: FirestoreOpportunity['metadata'];
};

export const useOpportunityDetails = (id: string) => {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { deleteOpportunity } = useOpportunities();
  const { data: opportunity, isLoading, error } = useOpportunity(id);
  const { mutateAsync: updateOpp } = useUpdateOpportunity();

  const [state, setState] = useState<OpportunityState<FirestoreOpportunity>>({
    opportunity: opportunity || null,
    isLoading,
    error: error instanceof Error ? error : null,
    isDeleting: false,
    deleteDialog: false,
    editDialog: false,
    editData: {},
    isEditing: false,
  });

  const canModify =
    user &&
    (user.email === opportunity?.metadata?.created_by ||
      user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL);

  const handleDeleteClick = () => {
    setState((prev) => ({ ...prev, deleteDialog: true }));
  };

  const handleDeleteCancel = () => {
    setState((prev) => ({ ...prev, deleteDialog: false }));
  };

  const handleDeleteConfirm = async () => {
    if (!opportunity?.id) return;

    setState((prev) => ({ ...prev, isDeleting: true }));

    try {
      await deleteOpportunity(opportunity.id);
      setState((prev) => ({ ...prev, deleteDialog: false }));
      router.push('/opportunities');
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error : new Error(String(error)),
      }));
    } finally {
      setState((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  const handleEditClick = () => {
    if (!opportunity) return;

    setState((prev) => ({
      ...prev,
      editData: {
        name: opportunity.name,
        description: opportunity.description,
        value: opportunity.value,
        offer_link: opportunity.offer_link,
        bonus: opportunity.bonus,
        details: opportunity.details,
      },
      editDialog: true,
    }));
  };

  const handleEditCancel = () => {
    setState((prev) => ({
      ...prev,
      editDialog: false,
      editData: {},
    }));
  };

  const handleEditConfirm = async () => {
    if (!opportunity?.id || !state.editData) return;

    try {
      await updateOpp({
        id: opportunity.id,
        data: {
          ...state.editData,
          metadata: {
            ...opportunity.metadata,
            updated_at: new Date().toISOString(),
          },
        },
      });

      setState((prev) => ({ ...prev, editDialog: false, editData: {} }));
      toast.success('Changes saved successfully');
    } catch (error) {
      toast.error('Failed to save changes: ' + (error as Error).message);
    }
  };

  const handleFieldUpdate = useCallback(
    async (field: string, value: unknown) => {
      if (!opportunity?.id) return;

      try {
        setState((prev) => ({ ...prev, isEditing: true }));

        const updateData: UpdateData = {};
        set(updateData, field, value);

        updateData.metadata = {
          ...opportunity.metadata,
          updated_at: new Date().toISOString(),
        };

        // Optimistically update the cache
        const previousData = queryClient.getQueryData<FirestoreOpportunity>(
          opportunityKeys.detail(opportunity.id)
        );

        if (previousData) {
          const updatedData = { ...previousData };
          set(updatedData, field, value);
          updatedData.metadata = updateData.metadata;

          queryClient.setQueryData(opportunityKeys.detail(opportunity.id), updatedData);
        }

        // Send update to server
        await updateOpp({
          id: opportunity.id,
          data: updateData,
        });

        toast.success('Field updated successfully');
      } catch (error) {
        toast.error('Failed to update field: ' + (error as Error).message);
        // Revert optimistic update on error
        if (opportunity?.id) {
          queryClient.invalidateQueries({
            queryKey: opportunityKeys.detail(opportunity.id),
          });
        }
      } finally {
        setState((prev) => ({ ...prev, isEditing: false }));
      }
    },
    [opportunity, updateOpp, queryClient]
  );

  return {
    state,
    canModify,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
    handleEditClick,
    handleEditCancel,
    handleEditConfirm,
    handleFieldUpdate,
  };
};

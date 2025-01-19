import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/lib/auth';
import { useOpportunities } from '@/lib/hooks/useOpportunities';
import { useOpportunity } from '@/lib/hooks/useOpportunity';
import { FirestoreOpportunity } from '@/types/opportunity';

import { OpportunityState } from './OpportunityDetails.types';

export const useOpportunityDetails = (id: string) => {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { deleteOpportunity, updateOpportunity } = useOpportunities();
  const { data: opportunity, isLoading, error } = useOpportunity(id);

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
    if (!opportunity?.id || !state.editData || !opportunity.metadata) return;

    setState((prev) => ({ ...prev, isEditing: true }));

    try {
      const valueToSave = state.editData.value;

      await updateOpportunity({
        id: opportunity.id,
        data: {
          ...state.editData,
          value: valueToSave,
          metadata: {
            ...opportunity.metadata,
            updated_at: new Date().toISOString(),
          },
        },
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['opportunity', opportunity.id] }),
        queryClient.invalidateQueries({ queryKey: ['opportunities'] }),
      ]);

      setState((prev) => ({
        ...prev,
        editDialog: false,
        editData: {},
      }));
    } catch (error) {
      setState((prev) => ({ ...prev, error: error as Error }));
    } finally {
      setState((prev) => ({ ...prev, isEditing: false }));
    }
  };

  return {
    state,
    canModify,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
    handleEditClick,
    handleEditCancel,
    handleEditConfirm,
  };
};

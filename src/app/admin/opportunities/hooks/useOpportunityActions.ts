'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';

import { supabase } from '@/lib/supabase/client';

import { useOpportunities } from './useOpportunities';
import { Opportunity } from '../types/opportunity';

export const useOpportunityActions = () => {
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(
    null
  );
  const [resetStagedDialogOpen, setResetStagedDialogOpen] = useState(false);
  const [resetAllDialogOpen, setResetAllDialogOpen] = useState(false);
  const [bulkApproveDialogOpen, setBulkApproveDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const { approveOpportunity, resetStagedOffers } = useOpportunities();

  const updateOptimisticData = useCallback(
    (opportunityId: string, updates: Partial<Opportunity>) => {
      queryClient.setQueryData<
        { items: Opportunity[]; total: number; hasMore: boolean } | undefined
      >(['opportunities'], (old) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.map((opp: Opportunity) =>
            opp.id === opportunityId ? { ...opp, ...updates } : opp
          ),
        };
      });

      queryClient.setQueryData<Opportunity[] | undefined>(
        ['opportunities', 'staged'],
        (old) => {
          if (!old) return old;
          return old.map((opp) =>
            opp.id === opportunityId ? { ...opp, ...updates } : opp
          );
        }
      );

      queryClient.setQueryData<Opportunity[] | undefined>(
        ['opportunities', 'approved'],
        (old) => {
          if (!old) return old;
          return old.map((opp) =>
            opp.id === opportunityId ? { ...opp, ...updates } : opp
          );
        }
      );
    },
    [queryClient]
  );

  const handleReject = async (opportunity: Opportunity & { isStaged?: boolean }) => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('No authenticated user found');
      }

      // Store previous data for rollback
      const previousData = {
        opportunities: queryClient.getQueryData(['opportunities']),
        staged: queryClient.getQueryData(['opportunities', 'staged']),
        approved: queryClient.getQueryData(['opportunities', 'approved']),
      };

      // Optimistically update UI
      updateOptimisticData(opportunity.id, { status: 'rejected' });

      try {
        const { error } = await supabase.rpc('reject_opportunity', {
          p_opportunity_id: opportunity.id,
        });

        if (error) {
          throw new Error(error.message || 'Failed to reject opportunity');
        }

        // Invalidate relevant queries after successful rejection
        await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
        await queryClient.invalidateQueries({ queryKey: ['opportunities', 'staged'] });
        await queryClient.invalidateQueries({ queryKey: ['opportunities', 'approved'] });
        await queryClient.invalidateQueries({ queryKey: ['opportunities', 'rejected'] });
      } catch (error) {
        // Rollback on error
        queryClient.setQueryData(['opportunities'], previousData.opportunities);
        queryClient.setQueryData(['opportunities', 'staged'], previousData.staged);
        queryClient.setQueryData(['opportunities', 'approved'], previousData.approved);
        throw error;
      }
    } catch (error) {
      console.error('Failed to reject opportunity:', error);
      throw error;
    }
  };

  const handleApprove = async (opportunity: Opportunity & { isStaged?: boolean }) => {
    if (opportunity.isStaged) {
      await approveOpportunity(opportunity);
    } else {
      const fullOpportunity = {
        ...opportunity,
        isStaged: false,
      };
      await approveOpportunity(fullOpportunity);
    }
  };

  const handleBulkApprove = async (force: boolean = false) => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('No authenticated user found');
      }

      const { error } = await supabase.rpc('bulk_approve_opportunities', {
        p_force: force,
      });

      if (error) {
        throw new Error(error.message || 'Failed to bulk approve opportunities');
      }

      await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      await queryClient.invalidateQueries({ queryKey: ['opportunities', 'staged'] });
      setBulkApproveDialogOpen(false);
    } catch (error) {
      console.error('Failed to bulk approve opportunities:', error);
    }
  };

  const resetMutation = useMutation({
    mutationFn: async (collection: 'opportunities' | 'staged_offers') => {
      const { error } = await supabase.rpc('reset_collection', {
        p_collection: collection,
      });

      if (error) {
        throw new Error('Failed to reset opportunities');
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'staged'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'approved'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'stats'] });
    },
  });

  const handleResetAll = useCallback(async () => {
    try {
      await resetMutation.mutateAsync('staged_offers');
      await resetMutation.mutateAsync('opportunities');
      setResetAllDialogOpen(false);
    } catch (error) {
      console.error('Error resetting all:', error);
    }
  }, [resetMutation, setResetAllDialogOpen]);

  const handleResetStaged = async () => {
    try {
      await resetStagedOffers();
      setResetStagedDialogOpen(false);
    } catch (error) {
      console.error('Failed to reset staged offers:', error);
    }
  };

  const handleMarkForReview = async (opportunity: Opportunity, reason: string) => {
    try {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'staged'] });

      updateOptimisticData(opportunity.id, {
        processing_status: {
          ...opportunity.processing_status,
          needs_review: true,
          review_reason: reason,
        },
      });

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('No authenticated user found');
      }

      const { error } = await supabase.rpc('mark_opportunity_for_review', {
        p_opportunity_id: opportunity.id,
        p_reason: reason,
      });

      if (error) {
        throw new Error(error.message || 'Failed to mark opportunity for review');
      }

      await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      await queryClient.invalidateQueries({ queryKey: ['opportunities', 'staged'] });
      await queryClient.invalidateQueries({ queryKey: ['opportunities', 'approved'] });
    } catch (error) {
      console.error('Failed to mark opportunity for review:', error);
      throw error;
    }
  };

  return {
    selectedOpportunity,
    setSelectedOpportunity,
    resetStagedDialogOpen,
    setResetStagedDialogOpen,
    resetAllDialogOpen,
    setResetAllDialogOpen,
    bulkApproveDialogOpen,
    setBulkApproveDialogOpen,
    handleReject,
    handleApprove,
    handleBulkApprove,
    handleResetAll,
    handleResetStaged,
    handleMarkForReview,
  };
};

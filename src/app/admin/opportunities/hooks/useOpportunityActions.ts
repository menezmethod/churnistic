'use client';

import { useQueryClient } from '@tanstack/react-query';
import { getAuth } from 'firebase/auth';
import { useState, useCallback } from 'react';

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
  const { approveOpportunity, rejectOpportunity, resetStagedOffers, resetOpportunities } =
    useOpportunities();

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
      const previousData = {
        approved: queryClient.getQueryData(['opportunities']),
        staged: queryClient.getQueryData(['opportunities', 'staged']),
      };

      updateOptimisticData(opportunity.id, { status: 'staged' });

      if (opportunity.status === 'approved') {
        const auth = getAuth();
        const idToken = await auth.currentUser?.getIdToken(true);

        if (!idToken) {
          throw new Error('No authenticated user found');
        }

        try {
          const response = await fetch(
            `/api/opportunities/${opportunity.id}?action=reject`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${idToken}`,
              },
              credentials: 'include',
            }
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(
              error.details || error.error || 'Failed to reject opportunity'
            );
          }

          await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
          await queryClient.invalidateQueries({ queryKey: ['opportunities', 'staged'] });
        } catch (error) {
          queryClient.setQueryData(['opportunities'], previousData.approved);
          queryClient.setQueryData(['opportunities', 'staged'], previousData.staged);
          throw error;
        }
      } else {
        await rejectOpportunity(opportunity);
      }
    } catch (error) {
      console.error('Failed to reject opportunity:', error);
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
      const auth = getAuth();
      const idToken = await auth.currentUser?.getIdToken(true);

      if (!idToken) {
        throw new Error('No authenticated user found');
      }

      const response = await fetch('/api/opportunities/approve/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ force }),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.details || error.error || 'Failed to bulk approve opportunities'
        );
      }

      await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      await queryClient.invalidateQueries({ queryKey: ['opportunities', 'staged'] });
      setBulkApproveDialogOpen(false);
    } catch (error) {
      console.error('Failed to bulk approve opportunities:', error);
    }
  };

  const handleResetStaged = async () => {
    try {
      await resetStagedOffers();
      setResetStagedDialogOpen(false);
    } catch (error) {
      console.error('Failed to reset staged offers:', error);
    }
  };

  const handleResetAll = async () => {
    try {
      await resetOpportunities();
      setResetAllDialogOpen(false);
    } catch (error) {
      console.error('Failed to reset opportunities:', error);
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

      const auth = getAuth();
      const idToken = await auth.currentUser?.getIdToken(true);

      if (!idToken) {
        throw new Error('No authenticated user found');
      }

      const response = await fetch(
        `/api/opportunities/${opportunity.id}?action=mark-for-review`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ reason }),
          credentials: 'include',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.details || error.error || 'Failed to mark opportunity for review'
        );
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
    handleResetStaged,
    handleResetAll,
    handleMarkForReview,
  };
};

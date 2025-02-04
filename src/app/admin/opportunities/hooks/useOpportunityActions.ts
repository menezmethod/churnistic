'use client';

import { useQueryClient } from '@tanstack/react-query';
import { getAuth } from 'firebase/auth';
import { useState, useCallback } from 'react';

import { useOpportunities } from './useOpportunities';
import { Opportunity, OpportunityStatus } from '../types/opportunity';

export const useOpportunityActions = () => {
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(
    null
  );
  const [resetStagedDialogOpen, setResetStagedDialogOpen] = useState(false);
  const [resetAllDialogOpen, setResetAllDialogOpen] = useState(false);
  const [bulkApproveDialogOpen, setBulkApproveDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const {
    approveOpportunity,
    rejectOpportunity,
    bulkApproveOpportunities,
    resetStagedOffers,
    resetOpportunities,
  } = useOpportunities();

  const updateOptimisticData = useCallback(
    (opportunityId: string, newStatus: OpportunityStatus) => {
      queryClient.setQueryData<
        { items: Opportunity[]; total: number; hasMore: boolean } | undefined
      >(['opportunities'], (old) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.map((opp: Opportunity) =>
            opp.id === opportunityId ? { ...opp, status: newStatus } : opp
          ),
        };
      });

      queryClient.setQueryData<Opportunity[] | undefined>(
        ['opportunities', 'staged'],
        (old) => {
          if (!old) return old;
          return old.map((opp) =>
            opp.id === opportunityId ? { ...opp, status: newStatus } : opp
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

      updateOptimisticData(opportunity.id, 'staged');

      if (opportunity.status === 'approved') {
        const auth = getAuth();
        const idToken = await auth.currentUser?.getIdToken(true);

        if (!idToken) {
          throw new Error('No authenticated user found');
        }

        try {
          const response = await fetch('/api/opportunities/reject', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ id: opportunity.id }),
            credentials: 'include',
          });

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

  const handleBulkApprove = async () => {
    try {
      await bulkApproveOpportunities();
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
  };
};

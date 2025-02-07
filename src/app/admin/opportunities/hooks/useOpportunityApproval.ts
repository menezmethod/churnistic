'use client';

import { useQueryClient, useMutation } from '@tanstack/react-query';
import { getAuth } from 'firebase/auth';

interface BulkApproveResponse {
  message: string;
  approvedCount: number;
  needsReviewCount: number;
  processedCount: number;
  skippedOffers?: Array<{
    id: string;
    name: string;
    reason?: string;
  }>;
}

interface BulkApproveResult {
  success: boolean;
  approved: number;
  needsReview: number;
  skippedOffers: Array<{
    id: string;
    name: string;
    reason?: string;
  }>;
}

export const useOpportunityApproval = () => {
  const queryClient = useQueryClient();

  const bulkApproveMutation = useMutation({
    mutationFn: async ({ force }: { force: boolean }): Promise<BulkApproveResponse> => {
      const auth = getAuth();
      const idToken = await auth.currentUser?.getIdToken(true);

      if (!idToken) {
        throw new Error('No authenticated user found');
      }

      const response = await fetch('/api/listings/approve/bulk', {
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
          error.details || error.error || 'Failed to approve opportunities'
        );
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'staged'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'approved'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities', 'stats'] });
    },
  });

  const approveOffers = async (force: boolean): Promise<BulkApproveResult> => {
    try {
      const result = await bulkApproveMutation.mutateAsync({ force });

      return {
        success: true,
        approved: result.approvedCount,
        needsReview: result.needsReviewCount,
        skippedOffers: result.skippedOffers || [],
      };
    } catch (error) {
      console.error('Error approving offers:', error);
      throw error;
    }
  };

  return {
    approveOffers,
    isApproving: bulkApproveMutation.isPending,
    error: bulkApproveMutation.error,
  };
};

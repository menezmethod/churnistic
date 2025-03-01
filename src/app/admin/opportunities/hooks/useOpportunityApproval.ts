'use client';

import { useQueryClient, useMutation } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';

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
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('No authenticated user found');
      }

      const { data, error } = await supabase.rpc('bulk_approve_opportunities', {
        p_force: force,
      });

      if (error) {
        throw new Error(error.message || 'Failed to approve opportunities');
      }

      return {
        message: data.message || 'Successfully approved opportunities',
        approvedCount: data.approved_count || 0,
        needsReviewCount: data.needs_review_count || 0,
        processedCount: data.processed_count || 0,
        skippedOffers: data.skipped_offers || [],
      };
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

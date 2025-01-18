'use client';

import { ArrowBack } from '@mui/icons-material';
import { Box, Button, Container, Grid, Link } from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { useOpportunities } from '@/lib/hooks/useOpportunities';
import { useOpportunity } from '@/lib/hooks/useOpportunity';
import { FirestoreOpportunity } from '@/types/opportunity';

import { BonusDetailsSection } from './components/BonusDetailsSection';
import { BonusTiersSection } from './components/BonusTiersSection';
import { DeleteDialog } from './components/DeleteDialog';
import { EditDialog } from './components/EditDialog';
import { ErrorState } from './components/ErrorState';
import { HeaderSection } from './components/HeaderSection';
import { LoadingState } from './components/LoadingState';
import { QuickActionsSection } from './components/QuickActionsSection';

export default function OpportunityDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: opportunity, isLoading, error } = useOpportunity(params.id);
  const { deleteOpportunity, updateOpportunity } = useOpportunities();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editData, setEditData] = useState<Partial<FirestoreOpportunity>>({});
  const [originalData, setOriginalData] = useState<FirestoreOpportunity | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Check if user can edit/delete this opportunity
  const canModify = Boolean(
    user &&
      (user.email === opportunity?.metadata?.created_by ||
        user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL)
  );

  console.log('User:', user);
  console.log('Opportunity creator:', opportunity?.metadata?.created_by);
  console.log('Admin email:', process.env.NEXT_PUBLIC_ADMIN_EMAIL);
  console.log('Can modify:', canModify);

  const handleDeleteClick = () => {
    console.log('Delete button clicked');
    setDeleteDialog(true);
    console.log('Delete dialog state:', deleteDialog);
  };

  const handleDeleteCancel = () => {
    setDeleteDialog(false);
  };

  const handleOptimisticDelete = (id: string) => {
    // Optimistically remove the opportunity from the list
    queryClient.setQueryData(
      ['opportunities'],
      (old: FirestoreOpportunity[] | undefined) => old?.filter((o) => o.id !== id) || []
    );
  };

  const handleRollbackDelete = () => {
    // Restore the opportunity if deletion fails
    queryClient.setQueryData(
      ['opportunities'],
      (old: FirestoreOpportunity[] | undefined) => {
        if (!opportunity) return old || [];
        return [...(old || []), opportunity];
      }
    );
  };

  const handleDeleteConfirm = async (id: string) => {
    if (!opportunity?.id) return;

    setIsDeleting(true);
    try {
      // Apply optimistic update
      handleOptimisticDelete(id);

      await deleteOpportunity(id);
      setDeleteDialog(false);
      router.push('/opportunities');
    } catch (error) {
      console.error('Failed to delete opportunity:', error);
      // Rollback on error
      handleRollbackDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = () => {
    if (!opportunity) return;
    setOriginalData(opportunity);
    setEditData({
      name: opportunity.name,
      description: opportunity.description,
      value: opportunity.value,
      offer_link: opportunity.offer_link,
      bonus: opportunity.bonus,
      details: opportunity.details,
    });
    setEditDialog(true);
  };

  const handleEditCancel = () => {
    setEditDialog(false);
    setEditData({});
  };

  const handleEditConfirm = async () => {
    if (!opportunity?.id || !editData || !opportunity.metadata) return;

    setIsEditing(true);
    try {
      // Convert value to number if it's a string
      const valueToSave =
        typeof editData.value === 'string' ? parseFloat(editData.value) : editData.value;

      await updateOpportunity({
        id: opportunity.id,
        data: {
          ...editData,
          value: valueToSave,
          metadata: {
            created_at: opportunity.metadata.created_at,
            created_by: opportunity.metadata.created_by,
            status: opportunity.metadata.status,
            updated_at: new Date().toISOString(),
          },
        },
      });

      // Invalidate both the individual opportunity and the opportunities list
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['opportunity', opportunity.id] }),
        queryClient.invalidateQueries({ queryKey: ['opportunities'] }),
      ]);

      setEditDialog(false);
      setEditData({});
    } catch (error) {
      console.error('Failed to update opportunity:', error);
    } finally {
      setIsEditing(false);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <LoadingState />
      </Container>
    );
  }

  if (error || !opportunity) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <ErrorState
          error={error instanceof Error ? error : new Error('Opportunity not found')}
        />
      </Container>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: 4,
        animation: 'fadeIn 0.5s ease-out',
        '@keyframes fadeIn': {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      {/* Header with Back button */}
      <Box sx={{ mb: 4 }}>
        <Link href="/opportunities" style={{ textDecoration: 'none' }}>
          <Button
            startIcon={<ArrowBack />}
            variant="outlined"
            sx={{
              mb: 3,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                transform: 'translateX(-4px)',
              },
            }}
          >
            Back to Opportunities
          </Button>
        </Link>

        <HeaderSection opportunity={opportunity} />
      </Box>

      {/* Main Content */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Box sx={{ px: 3 }}>
            <BonusDetailsSection opportunity={opportunity} />
            <BonusTiersSection opportunity={opportunity} />
          </Box>
        </Grid>

        {/* Right Sidebar */}
        <Grid item xs={12} md={4}>
          <QuickActionsSection
            opportunity={opportunity}
            canModify={canModify}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteClick}
          />
        </Grid>
      </Grid>

      {/* Dialogs */}
      {opportunity.id && (
        <DeleteDialog
          open={deleteDialog}
          opportunityId={opportunity.id}
          opportunityName={opportunity.name}
          isDeleting={isDeleting}
          onCancel={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
        />
      )}

      <EditDialog
        open={editDialog}
        editData={editData}
        originalData={originalData!}
        isEditing={isEditing}
        onCancel={handleEditCancel}
        onConfirm={handleEditConfirm}
        onChange={setEditData}
      />
    </Container>
  );
}

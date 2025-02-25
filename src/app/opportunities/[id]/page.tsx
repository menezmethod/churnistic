'use client';

import { ArrowBack } from '@mui/icons-material';
import { Box, Button, Container, Grid, Link } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import { useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { useOpportunities } from '@/lib/hooks/useOpportunities';
import { useOpportunity } from '@/lib/hooks/useOpportunity';
import { FirestoreOpportunity } from '@/types/opportunity';

import AccountDetailsSection from './components/AccountDetailsSection';
import AvailabilitySection from './components/AvailabilitySection';
import BonusDetailsSection from './components/BonusDetailsSection';
import { EditDialog } from './components/EditDialog';
import { ErrorState } from './components/ErrorState';
import { HeaderSection } from './components/HeaderSection';
import { LoadingState } from './components/LoadingState';
import { QuickActionsSection } from './components/QuickActionsSection';
import OpportunityDeleteDialog from '../components/OpportunityDeleteDialog';

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
  const theme = useTheme();

  // Check if user can edit/delete this opportunity
  const canModify = Boolean(
    user?.email &&
      opportunity?.metadata?.created_by &&
      (user.email === opportunity.metadata.created_by ||
        user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL)
  );

  // Debug logging
  console.log('Auth Debug:', {
    userEmail: user?.email,
    creatorEmail: opportunity?.metadata?.created_by,
    adminEmail: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
    canModify,
  });

  const handleDeleteClick = () => {
    setDeleteDialog(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialog(false);
  };

  const handleDeleteConfirm = async () => {
    if (!opportunity?.id) return;

    setIsDeleting(true);
    try {
      // Navigate away first for better UX
      router.push('/opportunities');
      // Then perform the deletion
      await deleteOpportunity(opportunity.id);
    } catch (error) {
      console.error('Failed to delete opportunity:', error);
      // Even if deletion fails, we stay on the opportunities list
    } finally {
      setIsDeleting(false);
      setDeleteDialog(false);
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
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <LoadingState />
      </Container>
    );
  }

  if (error || !opportunity) {
    return (
      <Container maxWidth="xl" sx={{ py: 8 }}>
        <ErrorState
          error={error instanceof Error ? error : new Error('Opportunity not found')}
        />
      </Container>
    );
  }

  return (
    <Container
      maxWidth="xl"
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
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateX(-4px)',
                bgcolor: alpha(theme.palette.primary.main, 0.05),
              },
            }}
          >
            Back to Opportunities
          </Button>
        </Link>

        <HeaderSection opportunity={opportunity} />
      </Box>

      {/* Main Content */}
      <Grid container spacing={4}>
        {/* Left Column - Main Content */}
        <Grid item xs={12} lg={8}>
          <Box>
            <BonusDetailsSection bonus={opportunity.bonus} />
            <AccountDetailsSection
              details={opportunity.details}
              type={opportunity.type}
            />
            <AvailabilitySection availability={opportunity.details?.availability} />
          </Box>
        </Grid>

        {/* Right Column - Quick Actions */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ position: 'sticky', top: 24 }}>
            <QuickActionsSection
              opportunity={opportunity}
              canModify={canModify}
              onEditClick={handleEditClick}
              onDeleteClick={handleDeleteClick}
            />
          </Box>
        </Grid>
      </Grid>

      {/* Dialogs */}
      {opportunity.id && (
        <OpportunityDeleteDialog
          open={deleteDialog}
          opportunity={opportunity}
          onCancelAction={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          loading={isDeleting}
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

'use client';

import { ArrowBack } from '@mui/icons-material';
import { Box, Button, Container, Grid, Link } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, getFirestore, updateDoc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { Permission, UserRole } from '@/lib/auth/types';
import { useOpportunities } from '@/lib/hooks/useOpportunities';
import { useOpportunity } from '@/lib/hooks/useOpportunity';
import { showErrorToast } from '@/lib/utils/toast';

import AccountDetailsSection from './components/AccountDetailsSection';
import AvailabilitySection from './components/AvailabilitySection';
import BonusDetailsSection from './components/BonusDetailsSection';
import { BonusTiersSection } from './components/BonusTiersSection';
import { ErrorState } from './components/ErrorState';
import { HeaderSection } from './components/HeaderSection';
import { LoadingState } from './components/LoadingState';
import { QuickActionsSection } from './components/QuickActionsSection';
import { BonusDetails, AccountDetails } from './OpportunityDetails.types';
import { useOpportunityDetails } from './useOpportunityDetails'; // Assuming you are using it in page.tsx
import OpportunityDeleteDialog from '../components/OpportunityDeleteDialog';

// Add this type helper
type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

const toggleFeatureStatus = async (params: { id: string; featured: boolean }) => {
  const db = getFirestore();
  const docRef = doc(db, 'opportunities', params.id);

  await updateDoc(docRef, {
    'metadata.featured': params.featured,
    'metadata.updated_at': new Date().toISOString(),
  });
};

// Update the type guard to check property types
const isBonusValid = (bonus: unknown): bonus is BonusDetails =>
  !!bonus &&
  typeof bonus === 'object' &&
  'description' in bonus &&
  typeof (bonus as BonusDetails).description === 'string' &&
  'requirements' in bonus &&
  Array.isArray((bonus as BonusDetails).requirements);

export default function OpportunityDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAdmin, hasRole, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const { data: opportunity, isLoading, error } = useOpportunity(params.id);
  const { deleteOpportunity } = useOpportunities();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [isGlobalEditMode, setIsGlobalEditMode] = useState(false);
  const theme = useTheme();
  const { handleFieldUpdate } = useOpportunityDetails(params.id as string);

  // Check if user can edit/delete this opportunity
  const canModify =
    !!user &&
    (isAdmin ||
      hasRole(UserRole.SUPER_ADMIN) ||
      (hasRole(UserRole.CONTRIBUTOR) && hasPermission(Permission.MANAGE_OPPORTUNITIES)) ||
      opportunity?.metadata?.created_by === user.email);

  // Debug logging
  console.log('Page Debug:', {
    userEmail: user?.email,
    creatorEmail: opportunity?.metadata?.created_by,
    isAdmin,
    hasRole: hasRole(UserRole.SUPER_ADMIN),
    canModify,
    isGlobalEditMode,
  });

  // Debug logging for opportunity data
  console.log('Opportunity Data:', {
    id: opportunity?.id,
    metadata: opportunity?.metadata,
    isFeatured: opportunity?.metadata?.featured,
  });

  const handleDeleteClick = () => {
    if (!user) {
      router.push('/auth/signin?redirect=/opportunities');
      return;
    }
    router.push(`/opportunities/${params.id}/delete`);
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

  const featureMutation = useMutation({
    mutationFn: toggleFeatureStatus,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['opportunity', params.id] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  const handleFeatureClick = async () => {
    if (!user) {
      router.push('/auth/signin?redirect=/opportunities');
      return;
    }
    if (!canModify) {
      return showErrorToast('You lack permissions to feature opportunities');
    }
    if (!opportunity) {
      return showErrorToast('Opportunity not found');
    }

    try {
      await featureMutation.mutateAsync({
        id: params.id as string,
        featured: !opportunity.metadata?.featured,
      });
    } catch (error) {
      console.error('Failed to toggle feature status:', error);
      showErrorToast('Failed to update feature status');
    }
  };

  // Toggle global edit mode
  const toggleGlobalEditMode = () => {
    setIsGlobalEditMode(!isGlobalEditMode);
    console.log('Toggling global edit mode:', !isGlobalEditMode);
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

        <HeaderSection
          opportunity={opportunity}
          canModify={canModify}
          isGlobalEditMode={isGlobalEditMode}
          onUpdate={(field, value) => handleFieldUpdate(field, value)}
        />
      </Box>

      {/* Main Content */}
      <Grid container spacing={4}>
        {/* Left Column - Main Content */}
        <Grid item xs={12} lg={8}>
          <Box>
            {isBonusValid(opportunity.bonus) && (
              <BonusDetailsSection
                bonus={opportunity.bonus}
                handleFieldUpdate={handleFieldUpdate}
                canModify={canModify}
                isGlobalEditMode={isGlobalEditMode}
              />
            )}
            {opportunity.bonus?.tiers && opportunity.bonus.tiers.length > 0 && (
              <BonusTiersSection
                opportunity={opportunity}
                onUpdate={handleFieldUpdate}
                canModify={canModify}
                isGlobalEditMode={isGlobalEditMode}
              />
            )}
            <AccountDetailsSection
              details={
                (opportunity.details as WithRequired<AccountDetails, 'monthly_fees'>) ??
                null
              }
              type={opportunity.type}
              canModify={canModify}
              isGlobalEditMode={isGlobalEditMode}
              onUpdate={(field, value) => handleFieldUpdate(field, value)}
            />
            <AvailabilitySection
              availability={opportunity.details?.availability}
              onUpdate={(field, value) => handleFieldUpdate(field, value)}
              canModify={canModify}
              isGlobalEditMode={isGlobalEditMode}
            />
          </Box>
        </Grid>

        {/* Right Column - Quick Actions */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ position: 'sticky', top: 24 }}>
            <QuickActionsSection
              opportunity={opportunity}
              canModify={canModify}
              onEditClick={toggleGlobalEditMode}
              onDeleteClick={handleDeleteClick}
              onFeatureClick={handleFeatureClick}
              isFeatureLoading={featureMutation.isPending}
              isGlobalEditMode={isGlobalEditMode}
              onUpdate={(field, value) => handleFieldUpdate(field, value)}
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
    </Container>
  );
}

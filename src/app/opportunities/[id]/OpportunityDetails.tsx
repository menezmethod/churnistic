'use client';

import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import {
  Box,
  Container,
  Typography,
  Paper,
  Chip,
  useTheme,
  alpha,
  Grid,
  Button,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { Permission } from '@/lib/auth/types';
import { useFieldUpdate } from '@/lib/hooks/useFieldUpdate';
import { useOpportunity } from '@/lib/hooks/useOpportunity';

import AccountDetailsSection from './components/AccountDetailsSection';
import AvailabilitySection from './components/AvailabilitySection';
import BonusDetailsSection from './components/BonusDetailsSection';
import { EditableField } from './components/EditableField';
import { ErrorState } from './components/ErrorState';
import { HeaderSection } from './components/HeaderSection';
import { LoadingState } from './components/LoadingState';

interface OpportunityDetailsProps {
  opportunity: FirestoreOpportunity;
}

const ValueDisplay = ({ value }: { value: string | number }) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Chip
      label={formatCurrency(value)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        fontWeight: 700,
        fontSize: '1.1rem',
        background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
        color: 'white',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered
          ? `0 4px 20px ${alpha(theme.palette.success.main, 0.4)}`
          : 'none',
      }}
    />
  );
};

export const OpportunityDetails = () => {
  const params = useParams<{ id: string }>();
  const { user, hasPermission } = useAuth();
  const { data: opportunity, isLoading, error } = useOpportunity(params.id);
  const canEdit = Boolean(user && hasPermission(Permission.FEATURE_OPPORTUNITIES));

  const { updateField, isUpdating } = useFieldUpdate({
    id: params.id,
    queryKey: ['opportunity', params.id],
  });

  if (isLoading) return <LoadingState />;
  if (error || !opportunity) {
    return (
      <ErrorState
        error={error instanceof Error ? error : new Error('Opportunity not found')}
      />
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* Title Section */}
        <Box sx={{ mb: 4 }}>
          <EditableField
            value={opportunity.title}
            onSave={(value) => updateField('title', value)}
            fieldName="Title"
            variant="h1"
            canEdit={canEdit}
            aiEnabled
          />

          <EditableField
            value={opportunity.description || ''}
            onSave={(value) => updateField('description', value)}
            fieldName="Description"
            variant="body1"
            multiline
            canEdit={canEdit}
            aiEnabled
          />
        </Box>

        {/* Main Content */}
        <Grid container spacing={4}>
          <Grid item xs={12} lg={8}>
            <Box>
              <BonusDetailsSection
                bonus={opportunity.bonus}
                canEdit={canEdit}
                onUpdate={(field, value) => updateField(`bonus.${field}`, value)}
              />
              <AccountDetailsSection
                details={opportunity.details}
                canEdit={canEdit}
                onUpdate={(field, value) => updateField(`details.${field}`, value)}
              />
            </Box>
          </Grid>

          {/* Right Column - Quick Actions & Stats */}
          <Grid item xs={12} lg={4}>
            <Box>
              <EditableField
                value={opportunity.status || 'Active'}
                onSave={(value) => updateField('status', value)}
                fieldName="Status"
                variant="h6"
                canEdit={canEdit}
              />

              <EditableField
                value={opportunity.value?.toString() || '0'}
                onSave={(value) => updateField('value', parseFloat(value))}
                fieldName="Value"
                variant="h4"
                canEdit={canEdit}
              />
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

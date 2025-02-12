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
  Stack,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useState } from 'react';

import { formatCurrency } from '@/lib/utils/formatters';
import { FirestoreOpportunity } from '@/types/opportunity';

import CardBadgeSection from './CardBadgeSection';
import AccountDetailsSection from './components/AccountDetailsSection';
import AvailabilitySection from './components/AvailabilitySection';
import BonusDetailsSection from './components/BonusDetailsSection';
import { EditableField } from './components/EditableField';
import { QuickActionsSection } from './components/QuickActionsSection';
import { useEditMode } from './hooks/useEditMode';

interface OpportunityDetailsProps {
  opportunity: FirestoreOpportunity;
  onUpdate?: (field: string, value: string | number | string[]) => void;
  canModify?: boolean;
  isGlobalEditMode?: boolean;
}

const ValueDisplay = ({
  value,
  isGlobalEditMode,
  onUpdate,
}: {
  value: string | number;
  isGlobalEditMode?: boolean;
  onUpdate?: (field: string, value: string | number) => void;
}) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  if (isGlobalEditMode && onUpdate) {
    return (
      <EditableField
        field={{
          value,
          isEditing: false,
          type: 'number',
        }}
        onEdit={(newValue) =>
          onUpdate('value', typeof newValue === 'boolean' ? 0 : newValue)
        }
        onStartEdit={() => {}}
        onCancelEdit={() => {}}
        className="value-edit"
      />
    );
  }

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

const formatDate = (date?: string) => {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return date;
  }
};

export default function OpportunityDetails({
  opportunity,
  onUpdate,
  canModify = false,
}: OpportunityDetailsProps) {
  const theme = useTheme();
  const { editState, toggleGlobalEditMode } = useEditMode(opportunity);

  const handleDeleteClick = () => {
    // Implement delete logic here
  };

  const handleFeatureClick = async () => {
    // Implement feature toggle logic here
  };

  const handleFieldUpdate = (field: string, value: string | number | string[]) => {
    if (!onUpdate) return;
    onUpdate(field, value);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box>
        {/* Header Section */}
        <Paper
          elevation={0}
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{
            p: 4,
            mb: 3,
            borderRadius: 3,
            background: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: alpha(theme.palette.divider, 0.1),
          }}
        >
          <Grid container spacing={4} alignItems="center">
            {/* Left side: Logo and details */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                {opportunity.logo && (
                  <Box
                    component="img"
                    src={opportunity.logo.url}
                    alt={opportunity.name}
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      objectFit: 'contain',
                      background: 'white',
                      p: 1,
                    }}
                  />
                )}
                <Box>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {editState.isGlobalEditMode ? (
                      <EditableField
                        field={{
                          value: opportunity.name,
                          isEditing: false,
                          type: 'text',
                        }}
                        onEdit={(value) => handleFieldUpdate('name', String(value))}
                        onStartEdit={() => {}}
                        onCancelEdit={() => {}}
                      />
                    ) : (
                      opportunity.name
                    )}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={
                        editState.isGlobalEditMode ? (
                          <EditableField
                            field={{
                              value: opportunity.type,
                              isEditing: false,
                              type: 'select',
                              options: ['credit_card', 'bank', 'investment'],
                            }}
                            onEdit={(value) => handleFieldUpdate('type', String(value))}
                            onStartEdit={() => {}}
                            onCancelEdit={() => {}}
                          />
                        ) : (
                          opportunity.type
                        )
                      }
                      size="small"
                      color={
                        opportunity.type === 'credit_card'
                          ? 'primary'
                          : opportunity.type === 'bank'
                            ? 'success'
                            : 'info'
                      }
                      sx={{ textTransform: 'uppercase' }}
                    />
                    <ValueDisplay
                      value={opportunity.value}
                      isGlobalEditMode={editState.isGlobalEditMode}
                      onUpdate={handleFieldUpdate}
                    />
                  </Box>
                </Box>
              </Box>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {editState.isGlobalEditMode ? (
                  <EditableField
                    field={{
                      value: opportunity.description || '',
                      isEditing: false,
                      type: 'multiline',
                    }}
                    onEdit={(value) => handleFieldUpdate('description', String(value))}
                    onStartEdit={() => {}}
                    onCancelEdit={() => {}}
                  />
                ) : (
                  opportunity.description
                )}
              </Typography>

              <Box sx={{ display: 'flex', gap: 2 }}>
                {editState.isGlobalEditMode ? (
                  <EditableField
                    field={{
                      value: opportunity.offer_link || '',
                      isEditing: false,
                      type: 'text',
                    }}
                    onEdit={(value) => handleFieldUpdate('offer_link', String(value))}
                    onStartEdit={() => {}}
                    onCancelEdit={() => {}}
                  />
                ) : (
                  <Button
                    variant="contained"
                    endIcon={<ArrowForwardIcon />}
                    component="a"
                    href={opportunity.offer_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    }}
                  >
                    Get This Offer
                  </Button>
                )}
              </Box>
            </Grid>

            {/* Right side: Card image if available */}
            {opportunity.card_image && (
              <Grid item xs={12} md={6}>
                <CardBadgeSection
                  cardImage={opportunity.card_image}
                  isGlobalEditMode={editState.isGlobalEditMode}
                  onUpdate={handleFieldUpdate}
                />
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Bonus Details Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <BonusDetailsSection
            bonus={opportunity.bonus}
            isGlobalEditMode={editState.isGlobalEditMode}
            onUpdate={handleFieldUpdate}
            canModify={canModify}
          />
        </motion.div>

        {/* Account Details Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <AccountDetailsSection
            details={opportunity.details}
            type={opportunity.type}
            isGlobalEditMode={editState.isGlobalEditMode}
            onUpdate={handleFieldUpdate}
          />
        </motion.div>

        {/* Availability Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <AvailabilitySection
            availability={opportunity.details?.availability}
            isGlobalEditMode={editState.isGlobalEditMode}
            onUpdate={handleFieldUpdate}
          />
        </motion.div>

        {/* Source Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              background: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(10px)',
              border: '1px solid',
              borderColor: alpha(theme.palette.divider, 0.1),
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Additional Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                {editState.isGlobalEditMode ? (
                  <EditableField
                    field={{
                      value: opportunity.metadata.status,
                      isEditing: false,
                      type: 'select',
                      options: ['ACTIVE', 'INACTIVE', 'EXPIRED', 'DRAFT'],
                    }}
                    onEdit={(value) =>
                      handleFieldUpdate('metadata.status', String(value))
                    }
                    onStartEdit={() => {}}
                    onCancelEdit={() => {}}
                  />
                ) : (
                  <Typography>{opportunity.metadata.status}</Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Bank
                </Typography>
                {editState.isGlobalEditMode ? (
                  <EditableField
                    field={{
                      value: opportunity.bank || '',
                      isEditing: false,
                      type: 'text',
                    }}
                    onEdit={(value) => handleFieldUpdate('bank', String(value))}
                    onStartEdit={() => {}}
                    onCancelEdit={() => {}}
                  />
                ) : (
                  <Typography>{opportunity.bank}</Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography>
                  {new Date(opportunity.metadata.updated_at).toLocaleDateString()}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </motion.div>

        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            maxWidth: '100%',
            width: '100%',
            mb: 4,
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={3}
            sx={{ width: '100%' }}
          >
            <Box sx={{ flex: 1 }}>
              {/* Title Section */}
              <Box sx={{ mb: 4 }}>
                {editState.isGlobalEditMode ? (
                  <EditableField
                    field={{
                      value: opportunity.title || '',
                      isEditing: false,
                      type: 'text',
                    }}
                    onEdit={(value) => handleFieldUpdate('title', String(value))}
                    onStartEdit={() => {}}
                    onCancelEdit={() => {}}
                  />
                ) : (
                  opportunity.title
                )}
              </Box>

              {/* Bonus Details Section */}
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.success.main, 0.05),
                  border: '1px solid',
                  borderColor: alpha(theme.palette.success.main, 0.1),
                  mb: 3,
                }}
              >
                <Typography variant="h6" color="success.main" gutterBottom>
                  Bonus Details
                </Typography>
                {editState.isGlobalEditMode ? (
                  <EditableField
                    field={{
                      value: opportunity.bonus?.description || '',
                      isEditing: false,
                      type: 'multiline',
                    }}
                    onEdit={(value) =>
                      handleFieldUpdate('bonus.description', String(value))
                    }
                    onStartEdit={() => {}}
                    onCancelEdit={() => {}}
                  />
                ) : (
                  opportunity.bonus?.description
                )}
                {editState.isGlobalEditMode ||
                  (opportunity.bonus?.requirements && (
                    <Box sx={{ mt: 2 }}>
                      <EditableField
                        field={{
                          value: opportunity.bonus?.requirements?.[0]?.description || '',
                          isEditing: false,
                          type: 'multiline',
                        }}
                        onEdit={(value) =>
                          handleFieldUpdate(
                            'bonus.requirements[0].description',
                            String(value)
                          )
                        }
                        onStartEdit={() => {}}
                        onCancelEdit={() => {}}
                      />
                    </Box>
                  ))}
              </Box>

              {/* Account Details Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Account Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    {editState.isGlobalEditMode ? (
                      <EditableField
                        field={{
                          value: opportunity.details?.account_type || '',
                          isEditing: false,
                          type: 'select',
                          options: ['Personal', 'Business', 'Both'],
                        }}
                        onEdit={(value) =>
                          handleFieldUpdate('details.account_type', String(value))
                        }
                        onStartEdit={() => {}}
                        onCancelEdit={() => {}}
                      />
                    ) : (
                      opportunity.details?.account_type
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {editState.isGlobalEditMode ? (
                      <EditableField
                        field={{
                          value: opportunity.details?.monthly_fees?.amount || '',
                          isEditing: false,
                          type: 'text',
                        }}
                        onEdit={(value) =>
                          handleFieldUpdate('details.monthly_fees.amount', String(value))
                        }
                        onStartEdit={() => {}}
                        onCancelEdit={() => {}}
                      />
                    ) : (
                      opportunity.details?.monthly_fees?.amount || ''
                    )}
                  </Grid>
                  {(editState.isGlobalEditMode ||
                    opportunity.details?.early_closure_fee) && (
                    <Grid item xs={12}>
                      {editState.isGlobalEditMode ? (
                        <EditableField
                          field={{
                            value: opportunity.details?.early_closure_fee || '',
                            isEditing: false,
                            type: 'text',
                          }}
                          onEdit={(value) =>
                            handleFieldUpdate('details.early_closure_fee', String(value))
                          }
                          onStartEdit={() => {}}
                          onCancelEdit={() => {}}
                        />
                      ) : (
                        opportunity.details?.early_closure_fee
                      )}
                    </Grid>
                  )}
                </Grid>
              </Box>

              {/* Expiry Date */}
              {(editState.isGlobalEditMode || opportunity.details?.expiration) && (
                <Box sx={{ mb: 3 }}>
                  {editState.isGlobalEditMode ? (
                    <EditableField
                      field={{
                        value: opportunity.details?.expiration || '',
                        isEditing: false,
                        type: 'date',
                      }}
                      onEdit={(value) =>
                        handleFieldUpdate('details.expiration', String(value))
                      }
                      onStartEdit={() => {}}
                      onCancelEdit={() => {}}
                    />
                  ) : (
                    formatDate(opportunity.details?.expiration)
                  )}
                </Box>
              )}
            </Box>

            {/* Quick Actions Section */}
            <Box sx={{ width: { xs: '100%', md: '320px' } }}>
              <QuickActionsSection
                opportunity={opportunity}
                canModify={canModify}
                onEditClick={() => toggleGlobalEditMode(!editState.isGlobalEditMode)}
                onDeleteClick={handleDeleteClick}
                onFeatureClick={handleFeatureClick}
                isFeatureLoading={false}
                isGlobalEditMode={editState.isGlobalEditMode}
                onUpdate={handleFieldUpdate}
              />
            </Box>
          </Stack>
        </Box>
      </Box>
    </Container>
  );
}

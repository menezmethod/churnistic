import {
  AccountBalance,
  Category,
  DeleteOutline,
  Edit as EditIcon,
  MonetizationOn,
  Star,
  StarBorder,
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { Permission, UserRole } from '@/lib/auth/types';
import { FirestoreOpportunity } from '@/types/opportunity';

import { EditableField } from './EditableField';
import { EditableWrapper } from './EditableWrapper';
import { useQuickStats } from '../hooks/useQuickStats';

interface QuickActionsSectionProps {
  opportunity: FirestoreOpportunity;
  canModify: boolean;
  onEditClick: () => void;
  onDeleteClick: () => void;
  onFeatureClick?: () => Promise<void>;
  isFeatureLoading?: boolean;
  isGlobalEditMode?: boolean;
  onUpdate?: (field: string, value: string | number | string[]) => void;
}

/**
 * Format a date string to a localized date string
 * @param date The date string to format
 * @returns Formatted date string or empty string if input is invalid
 */
const formatDate = (date?: string) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString();
};

export const QuickActionsSection = ({
  opportunity,
  canModify,
  onEditClick,
  onDeleteClick,
  onFeatureClick,
  isFeatureLoading: isFeatureLoadingProp,
  isGlobalEditMode,
  onUpdate,
}: QuickActionsSectionProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user, isAdmin, hasRole, hasPermission } = useAuth();

  // Logger for debugging
  const logDebug = (action: string, details: Record<string, unknown>) => {
    console.log(`[QuickActionsSection] ${action}:`, details);
  };

  logDebug('Rendering with roles', { canModify });
  logDebug('Opportunity data', { opportunity });

  // Check if user can edit this section
  const canEditSection =
    !!user &&
    canModify &&
    (isAdmin ||
      hasPermission(Permission.MANAGE_OPPORTUNITIES) ||
      hasRole(UserRole.ADMIN) ||
      hasRole(UserRole.SUPER_ADMIN));

  const isFeatured = Boolean(opportunity.metadata?.featured);
  const [isLocalFeatureLoading, setIsLocalFeatureLoading] = useState(false);
  const isFeatureLoading = isFeatureLoadingProp || isLocalFeatureLoading;

  // Use the specialized hook for quick stats fields
  // Only initialize if we have an opportunity ID
  const { updateValue, updateType, updateBank, isUpdating } = useQuickStats(
    opportunity.id || ''
  );

  // Only allow editing if we have an opportunity ID and user has permission
  const canEdit = !!opportunity.id && canEditSection;

  const handleFeatureClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!canModify || !onFeatureClick) return;
    setIsLocalFeatureLoading(true);
    try {
      await onFeatureClick();
    } finally {
      setIsLocalFeatureLoading(false);
    }
  };

  return (
    <Box sx={{ position: 'sticky', top: 24 }}>
      <Paper
        elevation={0}
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          bgcolor: isDark
            ? alpha(theme.palette.background.paper, 0.6)
            : 'background.paper',
          border: '1px solid',
          borderColor: isFeatured
            ? alpha(theme.palette.warning.main, 0.2)
            : isDark
              ? alpha(theme.palette.divider, 0.1)
              : 'divider',
          backdropFilter: 'blur(8px)',
          position: 'relative',
          transition: 'all 0.2s ease-in-out',
          ...(isFeatured && {
            boxShadow: `0 8px 16px ${alpha(theme.palette.warning.main, 0.15)}`,
          }),
        }}
      >
        <AnimatePresence>
          {isFeatured && (
            <Chip
              component={motion.div}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              icon={<Star sx={{ color: theme.palette.warning.main }} />}
              label="Featured Offer"
              size="small"
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                color: theme.palette.warning.main,
                borderColor: alpha(theme.palette.warning.main, 0.2),
                '& .MuiChip-icon': {
                  color: theme.palette.warning.main,
                },
              }}
            />
          )}
        </AnimatePresence>
        <Stack spacing={2}>
          {/* Credit Card Image */}
          {opportunity.type === 'credit_card' && opportunity.card_image?.url && (
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              sx={{
                width: '100%',
                mb: 2,
              }}
            >
              <Box
                component="img"
                src={opportunity.card_image.url}
                alt={`${opportunity.name} Card`}
                sx={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: 2,
                  transform: 'rotate(-5deg)',
                  transition: 'transform 0.3s ease-in-out',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
                  '&:hover': {
                    transform: 'rotate(0deg) scale(1.02)',
                  },
                }}
              />
            </Box>
          )}

          {/* Quick Stats */}
          <Box
            sx={{
              backgroundColor: (theme) => theme.palette.background.paper,
              borderRadius: 2,
              p: 2,
              mb: 2,
              boxShadow: (theme) =>
                `0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`,
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Quick Stats
            </Typography>
            <Stack spacing={2}>
              <EditableWrapper
                fieldName="value"
                value={opportunity.value || 0}
                type="number"
                formatter={(val) => `$${Number(val).toLocaleString()}`}
                canEdit={canEdit}
                isGlobalEditMode={isGlobalEditMode}
                onUpdate={(value) => updateValue(value)}
                isLoading={isUpdating('value')}
                icon={<MonetizationOn />}
                label="Value"
              />
              <EditableWrapper
                fieldName="type"
                value={opportunity.type || 'credit_card'}
                type="select"
                options={['credit_card', 'bank', 'brokerage']}
                optionLabels={{
                  credit_card: 'Credit Card',
                  bank: 'Bank Account',
                  brokerage: 'Brokerage',
                }}
                canEdit={canEdit}
                isGlobalEditMode={isGlobalEditMode}
                onUpdate={(value) => updateType(value)}
                isLoading={isUpdating('type')}
                icon={<Category />}
                label="Type"
              />
              {(isGlobalEditMode || opportunity.bank) && (
                <EditableWrapper
                  fieldName="bank"
                  value={opportunity.bank || ''}
                  type="text"
                  placeholder="Enter bank name"
                  canEdit={canEdit}
                  isGlobalEditMode={isGlobalEditMode}
                  onUpdate={(value) => updateBank(value)}
                  isLoading={isUpdating('bank')}
                  icon={<AccountBalance />}
                  label="Bank"
                />
              )}

              {/* Metadata section remains unchanged */}
              <Box sx={{ pt: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  Created: {formatDate(opportunity.metadata?.created_at)}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Last Updated: {formatDate(opportunity.metadata?.updated_at)}
                </Typography>
              </Box>

              {/* Opportunity status field */}
              {canEdit && (
                <EditableField
                  field={{
                    value: opportunity.metadata?.status || 'active',
                    isEditing: false,
                    type: 'select',
                    options: ['active', 'expired', 'paused'],
                    optionLabels: {
                      active: 'Active',
                      expired: 'Expired',
                      paused: 'Paused',
                    },
                  }}
                  onEdit={(value) => {
                    // We know this is a string since it's from a select field
                    if (typeof value === 'string') {
                      onUpdate?.('metadata.status', value);
                    }
                  }}
                  onStartEdit={() => {}}
                  onCancelEdit={() => {}}
                  editable={true}
                  fieldKey="status"
                  placeholder="Select status"
                  isUpdating={false}
                />
              )}
            </Stack>
          </Box>

          {/* Admin Actions */}
          {canEdit && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.background.paper, 0.6),
                border: '1px solid',
                borderColor: alpha(theme.palette.divider, 0.1),
              }}
            >
              <Stack direction="row" spacing={1}>
                {onFeatureClick && (
                  <IconButton
                    onClick={handleFeatureClick}
                    disabled={isFeatureLoading}
                    sx={{
                      flex: 1,
                      color: isFeatured ? theme.palette.warning.main : 'text.secondary',
                      bgcolor: alpha(
                        isFeatured
                          ? theme.palette.warning.main
                          : theme.palette.primary.main,
                        0.1
                      ),
                      borderRadius: 2,
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        bgcolor: alpha(
                          isFeatured
                            ? theme.palette.warning.main
                            : theme.palette.primary.main,
                          0.2
                        ),
                        transform: 'scale(1.05)',
                      },
                    }}
                  >
                    {isFeatureLoading ? (
                      <CircularProgress
                        size={20}
                        color={isFeatured ? 'warning' : 'primary'}
                      />
                    ) : isFeatured ? (
                      <Star
                        sx={{ color: theme.palette.warning.main, fontSize: '1.5rem' }}
                      />
                    ) : (
                      <StarBorder sx={{ fontSize: '1.5rem' }} />
                    )}
                  </IconButton>
                )}
                <IconButton
                  onClick={onEditClick}
                  sx={{
                    flex: 1,
                    color: isGlobalEditMode ? 'warning.main' : 'primary.main',
                    bgcolor: alpha(
                      isGlobalEditMode
                        ? theme.palette.warning.main
                        : theme.palette.primary.main,
                      0.1
                    ),
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: alpha(
                        isGlobalEditMode
                          ? theme.palette.warning.main
                          : theme.palette.primary.main,
                        0.2
                      ),
                    },
                  }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  onClick={onDeleteClick}
                  sx={{
                    flex: 1,
                    color: 'error.main',
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.error.main, 0.2),
                    },
                  }}
                >
                  <DeleteOutline />
                </IconButton>
              </Stack>
            </Box>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

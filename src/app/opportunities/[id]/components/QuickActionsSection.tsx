import {
  AccountBalance,
  Category,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MonetizationOn,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import {
  Box,
  CircularProgress,
  Chip,
  IconButton,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { Permission, UserRole } from '@/lib/auth/types';
import { FirestoreOpportunity, OfferType } from '@/types/opportunity';

import { EditableField } from './EditableField';
import { EditableWrapper } from './EditableWrapper';

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

  // Check if user can edit this section
  const canEdit =
    !!user &&
    canModify &&
    (isAdmin ||
      hasRole(UserRole.SUPER_ADMIN) ||
      (hasRole(UserRole.CONTRIBUTOR) && hasPermission(Permission.MANAGE_OPPORTUNITIES)) ||
      opportunity.metadata?.created_by === user.email);

  // Debug logging
  console.log('QuickActionsSection Debug:', {
    userEmail: user?.email,
    creatorEmail: opportunity.metadata?.created_by,
    isAdmin,
    hasRole: hasRole(UserRole.SUPER_ADMIN),
    canModify,
    canEdit,
  });

  const isFeatured = Boolean(opportunity.metadata?.featured);
  const [isLocalFeatureLoading, setIsLocalFeatureLoading] = useState(false);
  const isFeatureLoading = isFeatureLoadingProp || isLocalFeatureLoading;

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

  const handleFieldUpdate = (field: string, value: string | number | string[]) => {
    if (!onUpdate) return;
    onUpdate(`metadata.${field}`, value);
  };

  const handleValueChange = (value: string | number) => {
    if (!onUpdate || !canEdit) return;
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(numValue)) {
      onUpdate('value', numValue);
    }
  };

  const handleTypeChange = (value: string) => {
    if (!onUpdate || !canEdit) return;
    onUpdate('type', value as OfferType);
  };

  const handleBankChange = (value: string) => {
    if (!onUpdate || !canEdit) return;
    onUpdate('bank', value);
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
              icon={<StarIcon sx={{ color: theme.palette.warning.main }} />}
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
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.1),
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Quick Stats
            </Typography>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MonetizationOn sx={{ color: 'primary.main' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Value
                  </Typography>
                  <EditableWrapper
                    fieldName="value"
                    value={opportunity.value}
                    type="number"
                    isGlobalEditMode={isGlobalEditMode}
                    onUpdate={handleValueChange}
                    hideIcon={!canEdit}
                    customStyles={{
                      wrapper: {
                        width: '100%',
                      },
                      input: {
                        '& .MuiInputBase-root': {
                          bgcolor: 'transparent',
                          '&:hover, &:focus-within': {
                            bgcolor: alpha(theme.palette.background.paper, 0.6),
                          },
                        },
                      },
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      ${opportunity.value.toLocaleString()}
                    </Typography>
                  </EditableWrapper>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Category sx={{ color: 'primary.main' }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Type
                  </Typography>
                  <EditableWrapper
                    fieldName="type"
                    value={opportunity.type}
                    type="select"
                    options={['credit_card', 'bank', 'brokerage']}
                    isGlobalEditMode={isGlobalEditMode}
                    onUpdate={handleTypeChange}
                    hideIcon={!canEdit}
                    customStyles={{
                      wrapper: {
                        width: '100%',
                      },
                      input: {
                        '& .MuiInputBase-root': {
                          bgcolor: 'transparent',
                          '&:hover, &:focus-within': {
                            bgcolor: alpha(theme.palette.background.paper, 0.6),
                          },
                        },
                      },
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {opportunity.type.replace('_', ' ').toUpperCase()}
                    </Typography>
                  </EditableWrapper>
                </Box>
              </Box>
              {(isGlobalEditMode || opportunity.bank) && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountBalance sx={{ color: 'primary.main' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Bank
                    </Typography>
                    <EditableWrapper
                      fieldName="bank"
                      value={opportunity.bank || ''}
                      type="text"
                      isGlobalEditMode={isGlobalEditMode}
                      onUpdate={handleBankChange}
                      hideIcon={!canEdit}
                      showEmpty={isGlobalEditMode}
                      customStyles={{
                        wrapper: {
                          width: '100%',
                        },
                        input: {
                          '& .MuiInputBase-root': {
                            bgcolor: 'transparent',
                            '&:hover, &:focus-within': {
                              bgcolor: alpha(theme.palette.background.paper, 0.6),
                            },
                          },
                        },
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {opportunity.bank ||
                          (isGlobalEditMode ? '(Click to add bank)' : '')}
                      </Typography>
                    </EditableWrapper>
                  </Box>
                </Box>
              )}
            </Stack>
          </Box>

          {/* Metadata */}
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.secondary.main, 0.05),
              border: '1px solid',
              borderColor: alpha(theme.palette.secondary.main, 0.1),
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Metadata
            </Typography>
            <Stack spacing={1}>
              <Typography variant="caption" color="text.secondary">
                Created:{' '}
                {new Date(
                  opportunity.metadata?.created_at || new Date()
                ).toLocaleDateString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Last Updated:{' '}
                {new Date(
                  opportunity.metadata?.updated_at || new Date()
                ).toLocaleDateString()}
              </Typography>
              {isGlobalEditMode ? (
                <EditableField
                  editable={canEdit}
                  field={{
                    value: opportunity.metadata?.status || 'active',
                    isEditing: false,
                    type: 'select',
                    options: ['active', 'inactive'],
                  }}
                  onEdit={(value) => handleFieldUpdate('status', value as string)}
                  onStartEdit={() => {}}
                  onCancelEdit={() => {}}
                  sx={{
                    '& .MuiInputBase-root': {
                      bgcolor: 'transparent',
                      '&:hover, &:focus-within': {
                        bgcolor: alpha(theme.palette.background.paper, 0.6),
                      },
                    },
                  }}
                />
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Status: {opportunity.metadata?.status.toUpperCase()}
                </Typography>
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
                      <StarIcon
                        sx={{ color: theme.palette.warning.main, fontSize: '1.5rem' }}
                      />
                    ) : (
                      <StarBorderIcon sx={{ fontSize: '1.5rem' }} />
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
                  <DeleteIcon />
                </IconButton>
              </Stack>
            </Box>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

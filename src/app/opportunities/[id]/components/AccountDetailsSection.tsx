import { AccountBalance, CalendarToday, Payment } from '@mui/icons-material';
import { Box, Typography, Paper, alpha, useTheme, Grid, Stack } from '@mui/material';
import { motion } from 'framer-motion';
import React from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { Permission, UserRole } from '@/lib/auth/types';
import { FirestoreOpportunity } from '@/types/opportunity';

import { EditableWrapper } from './EditableWrapper';

interface AccountDetailsSectionProps {
  details?: FirestoreOpportunity['details'];
  type: FirestoreOpportunity['type'];
  isGlobalEditMode?: boolean;
  onUpdate?: (field: string, value: string | number | string[]) => void;
  canModify?: boolean;
}

interface DetailItem {
  icon: React.ReactElement;
  label: string;
  value: string;
  highlight?: boolean;
  warning?: boolean;
  subtext?: string;
  field?: string;
  type?: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'multiline';
  options?: string[];
}

const formatAnnualFees = (
  fees: { amount: string; waived_first_year: boolean } | null | undefined
) => {
  if (!fees) return null;
  return `${fees.amount}${fees.waived_first_year ? ' (First Year Waived)' : ''}`;
};

const formatForeignTransactionFees = (
  fees: { percentage: string; waived: boolean } | null | undefined
) => {
  if (!fees) return null;
  return fees.waived ? 'None' : fees.percentage;
};

export default function AccountDetailsSection({
  details,
  canModify,
  isGlobalEditMode,
  onUpdate,
}: AccountDetailsSectionProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user, isAdmin, hasRole, hasPermission } = useAuth();

  // Helper function to convert states object to array if needed
  const getStatesArray = (
    states: string[] | Record<string, string> | undefined
  ): string[] => {
    if (!states) return [];
    if (Array.isArray(states)) return states;
    if (typeof states === 'object') {
      return Object.values(states).filter(Boolean).map(String);
    }
    return [];
  };

  // Check if user can edit this section
  const canEdit =
    !!user &&
    canModify &&
    (isAdmin ||
      hasRole(UserRole.SUPER_ADMIN) ||
      (hasRole(UserRole.CONTRIBUTOR) && hasPermission(Permission.MANAGE_OPPORTUNITIES)));

  // Debug logging
  console.log('AccountDetailsSection Debug:', {
    userEmail: user?.email,
    isAdmin,
    hasRole: hasRole(UserRole.SUPER_ADMIN),
    canModify,
    canEdit,
    isGlobalEditMode,
  });

  if (!details && !isGlobalEditMode) return null;

  // Create an empty details object if it doesn't exist and we're in global edit mode
  const effectiveDetails = details || {};

  // Define all possible detail fields based on the opportunity type and the FirestoreOpportunity schema
  const allDetailItems: Array<DetailItem | null | undefined> = [
    // Common fields for all opportunity types
    {
      icon: <AccountBalance />,
      label: 'Account Type',
      value: effectiveDetails.account_type || '',
      field: 'details.account_type',
      type: 'select',
      options: ['Personal', 'Business', 'Both'],
      highlight: false,
    },
    {
      icon: <AccountBalance />,
      label: 'Account Category',
      value: effectiveDetails.account_category || '',
      field: 'details.account_category',
      type: 'select',
      options: ['personal', 'business'],
    },
    {
      icon: <Payment />,
      label: 'Monthly Fees',
      value: effectiveDetails.monthly_fees?.amount || '',
      field: 'details.monthly_fees.amount',
      type: 'text',
      highlight: effectiveDetails.monthly_fees?.amount === 'None',
      subtext: effectiveDetails.monthly_fees?.waiver_details,
    },
    {
      icon: <Payment />,
      label: 'Annual Fees',
      value: formatAnnualFees(effectiveDetails.annual_fees) || '',
      field: 'details.annual_fees.amount',
      type: 'text',
      highlight: effectiveDetails.annual_fees?.amount?.includes('No annual fee'),
    },
    {
      icon: <Payment />,
      label: 'Foreign Transaction Fees',
      value:
        formatForeignTransactionFees(effectiveDetails.foreign_transaction_fees) || '',
      field: 'details.foreign_transaction_fees.percentage',
      type: 'text',
      highlight: effectiveDetails.foreign_transaction_fees?.waived,
    },
    {
      icon: <AccountBalance />,
      label: 'Restrictions',
      value: [
        effectiveDetails.availability?.type === 'State'
          ? `${getStatesArray(effectiveDetails.availability?.states).join(', ')} only`
          : effectiveDetails.availability?.type === 'Nationwide'
            ? 'Available nationwide'
            : null,
        effectiveDetails.under_5_24 ? '5/24 Rule applies' : null,
        effectiveDetails.credit_score
          ? `${effectiveDetails.credit_score}+ credit score`
          : null,
        effectiveDetails.household_limit ? effectiveDetails.household_limit : null,
      ]
        .filter(Boolean)
        .join(' • '),
      warning:
        effectiveDetails.under_5_24 || effectiveDetails.availability?.type === 'State',
      highlight: effectiveDetails.availability?.type === 'Nationwide',
      subtext: effectiveDetails.availability?.details,
    },
    {
      icon: <AccountBalance />,
      label: 'Credit Inquiry',
      value: effectiveDetails.credit_inquiry || '',
      field: 'details.credit_inquiry',
      type: 'select',
      options: ['Hard Pull', 'Soft Pull', 'None'],
      warning: effectiveDetails.credit_inquiry === 'Hard Pull',
    },
    {
      icon: <Payment />,
      label: 'Minimum Credit Limit',
      value: effectiveDetails.minimum_credit_limit || '',
      field: 'details.minimum_credit_limit',
      type: 'text',
    },
    {
      icon: <AccountBalance />,
      label: 'Rewards Structure',
      value: effectiveDetails.rewards_structure || '',
      field: 'details.rewards_structure',
      type: 'multiline',
    },
    {
      icon: <AccountBalance />,
      label: 'Minimum Deposit',
      value: effectiveDetails.minimum_deposit || '',
      field: 'details.minimum_deposit',
      type: 'text',
    },
    {
      icon: <CalendarToday />,
      label: 'Holding Period',
      value: effectiveDetails.holding_period || '',
      field: 'details.holding_period',
      type: 'text',
    },
    {
      icon: <AccountBalance />,
      label: 'Options Trading',
      value: effectiveDetails.options_trading || '',
      field: 'details.options_trading',
      type: 'select',
      options: ['Yes', 'No'],
      highlight: effectiveDetails.options_trading === 'Yes',
    },
    {
      icon: <AccountBalance />,
      label: 'IRA Accounts',
      value: effectiveDetails.ira_accounts || '',
      field: 'details.ira_accounts',
      type: 'select',
      options: ['Yes', 'No'],
      highlight: effectiveDetails.ira_accounts === 'Yes',
    },
    {
      icon: <AccountBalance />,
      label: 'Trading Requirements',
      value: effectiveDetails.trading_requirements || '',
      field: 'details.trading_requirements',
      type: 'multiline',
    },
    {
      icon: <AccountBalance />,
      label: 'Platform Features',
      value: effectiveDetails.platform_features
        ? effectiveDetails.platform_features.map((f) => f.name).join(', ')
        : '',
      field: 'details.platform_features',
      type: 'multiline',
    },
    {
      icon: <Payment />,
      label: 'Early Closure Fee',
      value: effectiveDetails.early_closure_fee || '',
      field: 'details.early_closure_fee',
      type: 'text',
    },
    {
      icon: <AccountBalance />,
      label: 'ChexSystems',
      value: effectiveDetails.chex_systems || '',
      field: 'details.chex_systems',
      type: 'text',
    },
    {
      icon: <CalendarToday />,
      label: 'Offer Expires',
      value: effectiveDetails.expiration || '',
      field: 'details.expiration',
      type: 'date',
      warning:
        effectiveDetails.expiration &&
        !isNaN(new Date(effectiveDetails.expiration).getTime()),
    },
  ].filter((item): item is NonNullable<typeof item> & DetailItem => {
    // Show all items in global edit mode, otherwise only show items with values
    if (!item || typeof item === 'string') return false;

    if (isGlobalEditMode) {
      return true; // Show all fields in global edit mode
    } else {
      return typeof item.value === 'string' && item.value.length > 0;
    }
  });

  // Filter null/undefined items and type-cast for TypeScript
  const validDetailItems = allDetailItems.filter(
    (item): item is NonNullable<typeof item> & DetailItem => {
      // Show all items in global edit mode, otherwise only show items with values
      if (!item || typeof item === 'string') return false;

      if (isGlobalEditMode) {
        return true; // Show all fields in global edit mode
      } else {
        return typeof item.value === 'string' && item.value.length > 0;
      }
    }
  );

  if (validDetailItems.length === 0) return null;

  return (
    <Paper
      elevation={0}
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      sx={{
        p: 4,
        mb: 3,
        borderRadius: 3,
        bgcolor: isDark ? alpha(theme.palette.background.paper, 0.6) : 'background.paper',
        border: '1px solid',
        borderColor: isDark ? alpha(theme.palette.divider, 0.1) : 'divider',
        transition: 'all 0.3s',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(8px)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${theme.palette.info.main}, ${theme.palette.info.light})`,
        },
      }}
    >
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        Account Details
      </Typography>

      <Grid container spacing={3}>
        {validDetailItems.map((item, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Box
              sx={{
                p: 2,
                height: '100%',
                borderRadius: 2,
                bgcolor: item.warning
                  ? alpha(theme.palette.warning.main, 0.05)
                  : item.highlight
                    ? alpha(theme.palette.success.main, 0.05)
                    : alpha(theme.palette.background.default, 0.5),
                border: '1px solid',
                borderColor: item.warning
                  ? alpha(theme.palette.warning.main, 0.1)
                  : item.highlight
                    ? alpha(theme.palette.success.main, 0.1)
                    : alpha(theme.palette.divider, 0.1),
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: canEdit ? 'translateY(-2px)' : 'none',
                  boxShadow: canEdit ? theme.shadows[2] : 'none',
                  borderColor: canEdit
                    ? alpha(theme.palette.primary.main, 0.3)
                    : 'inherit',
                },
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <Box
                  sx={{
                    color: item.warning
                      ? theme.palette.warning.main
                      : item.highlight
                        ? theme.palette.success.main
                        : theme.palette.primary.main,
                  }}
                >
                  {item.icon}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {item.label}
                </Typography>
              </Stack>
              <Box sx={{ flex: 1, position: 'relative' }}>
                {item.field ? (
                  <EditableWrapper
                    fieldName={item.field}
                    value={item.value}
                    type={item.type || 'text'}
                    options={item.options}
                    isGlobalEditMode={isGlobalEditMode}
                    onUpdate={
                      item.field
                        ? (value) => onUpdate?.(item.field as string, value)
                        : undefined
                    }
                    hideIcon={!canEdit}
                    canEdit={canEdit || isGlobalEditMode}
                    tooltip={`Edit ${item.label.toLowerCase()}`}
                    showEmpty={isGlobalEditMode}
                    label={item.label}
                    placeholder={`Enter ${item.label.toLowerCase()}...`}
                    customStyles={{
                      wrapper: {
                        width: '100%',
                      },
                      input: {
                        bgcolor: 'transparent',
                        padding: 0,
                        '&:hover': {
                          bgcolor:
                            canEdit || isGlobalEditMode
                              ? alpha(theme.palette.background.paper, 0.6)
                              : 'transparent',
                        },
                      },
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: 500,
                        color: item.highlight ? 'success.main' : 'text.primary',
                      }}
                    >
                      {item.value || (isGlobalEditMode ? '(Click to add)' : '-')}
                    </Typography>
                  </EditableWrapper>
                ) : (
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 500,
                      color: item.highlight ? 'success.main' : 'text.primary',
                    }}
                  >
                    {item.value || '-'}
                  </Typography>
                )}
              </Box>
              {item.subtext && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {item.subtext}
                </Typography>
              )}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}

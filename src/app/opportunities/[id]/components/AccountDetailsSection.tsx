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
  fees: { amount: string; waived_first_year: boolean } | null
) => {
  if (!fees) return null;
  return `${fees.amount}${fees.waived_first_year ? ' (First Year Waived)' : ''}`;
};

const formatForeignTransactionFees = (
  fees: { percentage: string; waived: boolean } | null
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
  });

  if (!details) return null;

  const detailItems = [
    {
      icon: <AccountBalance />,
      label: 'Account Type',
      value: details.account_type || '',
      field: 'details.account_type',
      type: 'select',
      options: ['Personal', 'Business', 'Both'],
      highlight: false,
    },
    details.account_category && {
      icon: <AccountBalance />,
      label: 'Account Category',
      value: details.account_category,
      field: 'details.account_category',
      type: 'select',
      options: ['personal', 'business'],
    },
    {
      icon: <Payment />,
      label: 'Monthly Fees',
      value: details.monthly_fees?.amount || '',
      field: 'details.monthly_fees.amount',
      type: 'text',
      highlight: details.monthly_fees?.amount === 'None',
      subtext: details.monthly_fees?.waiver_details,
    },
    details.annual_fees && {
      icon: <Payment />,
      label: 'Annual Fees',
      value: formatAnnualFees(details.annual_fees) || '',
      field: 'details.annual_fees.amount',
      type: 'text',
      highlight: details.annual_fees?.amount?.includes('No annual fee'),
    },
    details.foreign_transaction_fees && {
      icon: <Payment />,
      label: 'Foreign Transaction Fees',
      value: formatForeignTransactionFees(details.foreign_transaction_fees) || '',
      field: 'details.foreign_transaction_fees.percentage',
      type: 'text',
      highlight: details.foreign_transaction_fees?.waived,
    },
    details.availability && {
      icon: <AccountBalance />,
      label: 'Restrictions',
      value: [
        details.availability.type === 'State'
          ? `${details.availability.states?.join(', ')} only`
          : null,
        details.under_5_24 ? '5/24 Rule applies' : null,
        details.credit_score ? `${details.credit_score}+ credit score` : null,
        details.household_limit ? details.household_limit : null,
      ]
        .filter(Boolean)
        .join(' • '),
      warning: details.under_5_24 || details.availability.type === 'State',
      highlight: details.availability.type === 'Nationwide',
      subtext: details.availability.details,
    },
    details.credit_inquiry && {
      icon: <AccountBalance />,
      label: 'Credit Inquiry',
      value: details.credit_inquiry,
      field: 'details.credit_inquiry',
      type: 'select',
      options: ['Hard Pull', 'Soft Pull', 'None'],
      warning: details.credit_inquiry === 'Hard Pull',
    },
    details.minimum_credit_limit && {
      icon: <Payment />,
      label: 'Minimum Credit Limit',
      value: details.minimum_credit_limit,
      field: 'details.minimum_credit_limit',
      type: 'text',
    },
    details.rewards_structure && {
      icon: <AccountBalance />,
      label: 'Rewards Structure',
      value: details.rewards_structure,
      field: 'details.rewards_structure',
      type: 'multiline',
    },
    details.minimum_deposit && {
      icon: <AccountBalance />,
      label: 'Minimum Deposit',
      value: details.minimum_deposit,
      field: 'details.minimum_deposit',
      type: 'text',
    },
    details.holding_period && {
      icon: <CalendarToday />,
      label: 'Holding Period',
      value: details.holding_period,
      field: 'details.holding_period',
      type: 'text',
    },
    details.options_trading && {
      icon: <AccountBalance />,
      label: 'Options Trading',
      value: details.options_trading,
      field: 'details.options_trading',
      type: 'select',
      options: ['Yes', 'No'],
      highlight: details.options_trading === 'Yes',
    },
    details.ira_accounts && {
      icon: <AccountBalance />,
      label: 'IRA Accounts',
      value: details.ira_accounts,
      field: 'details.ira_accounts',
      type: 'select',
      options: ['Yes', 'No'],
      highlight: details.ira_accounts === 'Yes',
    },
    details.trading_requirements && {
      icon: <AccountBalance />,
      label: 'Trading Requirements',
      value: details.trading_requirements,
      field: 'details.trading_requirements',
      type: 'multiline',
    },
    details.platform_features && {
      icon: <AccountBalance />,
      label: 'Platform Features',
      value: details.platform_features.map((f) => f.name).join(', '),
      field: 'details.platform_features',
      type: 'multiline',
    },
    details.early_closure_fee && {
      icon: <Payment />,
      label: 'Early Closure Fee',
      value: details.early_closure_fee,
      field: 'details.early_closure_fee',
      type: 'text',
    },
    details.chex_systems && {
      icon: <AccountBalance />,
      label: 'ChexSystems',
      value: details.chex_systems,
      field: 'details.chex_systems',
      type: 'text',
    },
    details.expiration && {
      icon: <CalendarToday />,
      label: 'Offer Expires',
      value: details.expiration,
      field: 'details.expiration',
      type: 'date',
      warning: details.expiration && !isNaN(new Date(details.expiration).getTime()),
    },
  ].filter((item): item is NonNullable<typeof item> & DetailItem => {
    if (!item || typeof item === 'string') return false;
    return typeof item.value === 'string' && item.value.length > 0;
  });

  if (detailItems.length === 0) return null;

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
        {detailItems.map((item, index) => (
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
                    onUpdate={onUpdate}
                    hideIcon={!canEdit}
                    tooltip={`Edit ${item.label.toLowerCase()}`}
                    showEmpty={isGlobalEditMode}
                    customStyles={{
                      wrapper: {
                        width: '100%',
                      },
                      input: {
                        bgcolor: 'transparent',
                        '&:hover': {
                          bgcolor: canEdit
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

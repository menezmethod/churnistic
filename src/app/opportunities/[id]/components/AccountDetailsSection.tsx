import {
  CreditScore,
  Warning,
  Receipt,
  Security,
  AccountBalance,
  Schedule,
  Rule,
  CreditCard,
  Stars,
  TrendingUp,
  Assignment,
  Apps,
} from '@mui/icons-material';
import { Box, Typography, Paper, Stack, alpha, useTheme, Chip } from '@mui/material';
import { motion } from 'framer-motion';

import { FirestoreOpportunity } from '@/types/opportunity';

interface AccountDetailsSectionProps {
  opportunity: FirestoreOpportunity;
}

export const AccountDetailsSection = ({ opportunity }: AccountDetailsSectionProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const hasDetails =
    opportunity.details?.monthly_fees?.waiver_details ||
    opportunity.details?.credit_inquiry ||
    opportunity.details?.household_limit ||
    opportunity.details?.early_closure_fee ||
    opportunity.details?.chex_systems ||
    opportunity.bonus?.requirements?.minimum_deposit ||
    opportunity.bonus?.requirements?.holding_period ||
    opportunity.details?.under_5_24 ||
    opportunity.details?.minimum_credit_limit ||
    opportunity.details?.rewards_structure ||
    opportunity.details?.options_trading ||
    opportunity.details?.ira_accounts ||
    opportunity.bonus?.requirements?.trading_requirements;

  if (!hasDetails) {
    return null;
  }

  const renderBankDetails = () => (
    <>
      {opportunity.bonus?.requirements?.minimum_deposit && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.success.main, 0.1),
            }}
          >
            <AccountBalance sx={{ color: 'success.main' }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Minimum Deposit
            </Typography>
            <Typography>${opportunity.bonus.requirements.minimum_deposit}</Typography>
          </Box>
        </Box>
      )}

      {opportunity.bonus?.requirements?.holding_period && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.info.main, 0.1),
            }}
          >
            <Schedule sx={{ color: 'info.main' }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Holding Period
            </Typography>
            <Typography>{opportunity.bonus.requirements.holding_period}</Typography>
          </Box>
        </Box>
      )}

      {opportunity.details?.early_closure_fee && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.error.main, 0.1),
            }}
          >
            <Warning sx={{ color: 'error.main' }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Early Closure Fee
            </Typography>
            <Typography>{opportunity.details.early_closure_fee}</Typography>
          </Box>
        </Box>
      )}

      {opportunity.details?.chex_systems && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.1),
            }}
          >
            <Security sx={{ color: 'primary.main' }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              ChexSystems
            </Typography>
            <Typography>{opportunity.details.chex_systems}</Typography>
          </Box>
        </Box>
      )}
    </>
  );

  const renderCreditCardDetails = () => (
    <>
      {opportunity.details?.under_5_24 && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.warning.main, 0.1),
            }}
          >
            <Rule sx={{ color: 'warning.main' }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Chase 5/24 Rule
            </Typography>
            <Typography>
              {opportunity.details.under_5_24.required ? 'Required' : 'Not Required'}
              {opportunity.details.under_5_24.details && (
                <Typography variant="body2" color="text.secondary">
                  {opportunity.details.under_5_24.details}
                </Typography>
              )}
            </Typography>
          </Box>
        </Box>
      )}

      {opportunity.details?.minimum_credit_limit && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.success.main, 0.1),
            }}
          >
            <CreditCard sx={{ color: 'success.main' }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Minimum Credit Limit
            </Typography>
            <Typography>{opportunity.details.minimum_credit_limit}</Typography>
          </Box>
        </Box>
      )}

      {opportunity.details?.rewards_structure && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.info.main, 0.1),
            }}
          >
            <Stars sx={{ color: 'info.main' }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Rewards Structure
            </Typography>
            {opportunity.details.rewards_structure.base_rewards && (
              <Typography variant="body2">
                Base: {opportunity.details.rewards_structure.base_rewards}
              </Typography>
            )}
            {opportunity.details.rewards_structure.welcome_bonus && (
              <Typography variant="body2">
                Welcome: {opportunity.details.rewards_structure.welcome_bonus}
              </Typography>
            )}
            {opportunity.details.rewards_structure.bonus_categories && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2">Bonus Categories:</Typography>
                {opportunity.details.rewards_structure.bonus_categories.map(
                  (category, index) => (
                    <Chip
                      key={index}
                      label={`${category.category}: ${category.rate}${
                        category.limit ? ` (up to $${category.limit})` : ''
                      }`}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  )
                )}
              </Box>
            )}
          </Box>
        </Box>
      )}
    </>
  );

  const renderBrokerageDetails = () => (
    <>
      {opportunity.details?.options_trading && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.success.main, 0.1),
            }}
          >
            <TrendingUp sx={{ color: 'success.main' }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Options Trading
            </Typography>
            <Typography>{opportunity.details.options_trading}</Typography>
          </Box>
        </Box>
      )}

      {opportunity.details?.ira_accounts && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.info.main, 0.1),
            }}
          >
            <AccountBalance sx={{ color: 'info.main' }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              IRA Accounts
            </Typography>
            <Typography>{opportunity.details.ira_accounts}</Typography>
          </Box>
        </Box>
      )}

      {opportunity.bonus?.requirements?.trading_requirements && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.warning.main, 0.1),
            }}
          >
            <Assignment sx={{ color: 'warning.main' }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Trading Requirements
            </Typography>
            <Typography>{opportunity.bonus.requirements.trading_requirements}</Typography>
          </Box>
        </Box>
      )}

      {opportunity.details?.platform_features && Array.isArray(opportunity.details.platform_features) && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.1),
            }}
          >
            <Apps sx={{ color: 'primary.main' }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Platform Features
            </Typography>
            {opportunity.details.platform_features.map((feature: { name: string; description: string }, index: number) => (
              <Box key={index} sx={{ mt: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                  {feature.name}
                </Typography>
                <Typography variant="body2">{feature.description}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </>
  );

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

      <Stack spacing={2.5}>
        {/* Common fields */}
        {opportunity.details?.monthly_fees?.waiver_details && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.success.main, 0.1),
              }}
            >
              <Receipt sx={{ color: 'success.main' }} />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Monthly Fee Waiver
              </Typography>
              <Typography>{opportunity.details.monthly_fees.waiver_details}</Typography>
            </Box>
          </Box>
        )}

        {opportunity.details?.credit_inquiry && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.warning.main, 0.1),
              }}
            >
              <CreditScore sx={{ color: 'warning.main' }} />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Credit Check Type
              </Typography>
              <Typography>{opportunity.details.credit_inquiry}</Typography>
            </Box>
          </Box>
        )}

        {/* Type-specific fields */}
        {opportunity.type === 'bank' && renderBankDetails()}
        {opportunity.type === 'credit_card' && renderCreditCardDetails()}
        {opportunity.type === 'brokerage' && renderBrokerageDetails()}
      </Stack>
    </Paper>
  );
};

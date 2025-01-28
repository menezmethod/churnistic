import { CreditScore, Warning, Home, Receipt, Security } from '@mui/icons-material';
import { Box, Typography, Paper, Stack, alpha, useTheme } from '@mui/material';
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
    opportunity.details?.chex_systems;

  if (!hasDetails) {
    return null;
  }

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

        {opportunity.details?.household_limit && (
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
              <Home sx={{ color: 'info.main' }} />
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Household Limit
              </Typography>
              <Typography>{opportunity.details.household_limit}</Typography>
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
      </Stack>
    </Paper>
  );
};

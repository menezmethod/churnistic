import {
  AccountBalance,
  AccessTime,
  ShowChart,
  CreditCard,
  Info,
} from '@mui/icons-material';
import { Box, Typography, Paper, Stack, alpha, useTheme, Grid } from '@mui/material';
import { motion } from 'framer-motion';

import { FirestoreOpportunity } from '@/types/opportunity';

interface BonusDetailsSectionProps {
  opportunity: FirestoreOpportunity;
}

export const BonusDetailsSection = ({ opportunity }: BonusDetailsSectionProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Paper
      elevation={0}
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
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
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
        },
      }}
    >
      <Grid container spacing={3}>
        <Grid item xs={12}>
          {opportunity.bonus?.description && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Description
              </Typography>
              <Typography>{opportunity.bonus.description}</Typography>
            </Box>
          )}

          {opportunity.bonus?.requirements && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Requirements
              </Typography>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.1),
                }}
              >
                <Typography sx={{ mb: 2 }}>
                  {opportunity.bonus.requirements.description}
                </Typography>

                <Stack spacing={1.5}>
                  {opportunity.bonus.requirements.minimum_deposit && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                        }}
                      >
                        <AccountBalance
                          sx={{ fontSize: '1.2rem', color: 'primary.main' }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Minimum Deposit
                        </Typography>
                        <Typography>
                          $
                          {opportunity.bonus.requirements.minimum_deposit.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {opportunity.bonus.requirements.holding_period && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                        }}
                      >
                        <AccessTime sx={{ fontSize: '1.2rem', color: 'primary.main' }} />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Holding Period
                        </Typography>
                        <Typography>
                          {opportunity.bonus.requirements.holding_period}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {opportunity.bonus.requirements.trading_requirements && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                        }}
                      >
                        <ShowChart sx={{ fontSize: '1.2rem', color: 'primary.main' }} />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Trading Requirements
                        </Typography>
                        <Typography>
                          {opportunity.bonus.requirements.trading_requirements}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {opportunity.bonus.requirements.spending_requirement && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                        }}
                      >
                        <CreditCard sx={{ fontSize: '1.2rem', color: 'primary.main' }} />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Spending Requirement
                        </Typography>
                        <Typography>
                          $
                          {opportunity.bonus.requirements.spending_requirement.amount.toLocaleString()}{' '}
                          in{' '}
                          {opportunity.bonus.requirements.spending_requirement.timeframe}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Stack>
              </Box>
            </Box>
          )}

          {opportunity.bonus?.additional_info && (
            <Box
              sx={{
                mt: 3,
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.warning.main, 0.05),
                border: '1px solid',
                borderColor: alpha(theme.palette.warning.main, 0.1),
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: 'warning.main',
                  fontStyle: 'italic',
                }}
              >
                <Info fontSize="small" />
                {opportunity.bonus.additional_info}
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
};

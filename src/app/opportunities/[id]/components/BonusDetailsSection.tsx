import { Box, Typography, Paper, alpha, useTheme, Grid } from '@mui/material';
import { motion } from 'framer-motion';

import { formatCurrency } from '@/lib/utils/formatters';
import { FirestoreOpportunity } from '@/types/opportunity';

interface BonusDetailsSectionProps {
  bonus?: FirestoreOpportunity['bonus'];
}

export default function BonusDetailsSection({ bonus }: BonusDetailsSectionProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!bonus) return null;

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
      <Typography variant="h6" gutterBottom>
        {bonus.title || 'Bonus Details'}
      </Typography>

      {bonus.description && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {bonus.description}
        </Typography>
      )}

      {bonus.requirements && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            {bonus.requirements.title || 'Requirements'}
          </Typography>

          {bonus.requirements.description && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {bonus.requirements.description}
            </Typography>
          )}

          {bonus.requirements.minimum_deposit && (
            <Typography variant="body2" color="text.secondary">
              • Minimum Deposit: {formatCurrency(bonus.requirements.minimum_deposit)}
            </Typography>
          )}

          {bonus.requirements.trading_requirements && (
            <Typography variant="body2" color="text.secondary">
              • Trading Requirements: {bonus.requirements.trading_requirements}
            </Typography>
          )}

          {bonus.requirements.holding_period && (
            <Typography variant="body2" color="text.secondary">
              • Holding Period: {bonus.requirements.holding_period}
            </Typography>
          )}

          {bonus.requirements.spending_requirement && (
            <Typography variant="body2" color="text.secondary">
              • Spend {formatCurrency(bonus.requirements.spending_requirement.amount)}{' '}
              within {bonus.requirements.spending_requirement.timeframe}
            </Typography>
          )}
        </Box>
      )}

      {bonus.tiers && bonus.tiers.length > 0 && (
        <Box>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Bonus Tiers
          </Typography>
          <Grid container spacing={2}>
            {bonus.tiers.map((tier, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.2),
                    height: '100%',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    {tier.level || tier.reward}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Deposit: {tier.deposit}
                  </Typography>
                  {tier.value && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Value: {formatCurrency(tier.value)}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    {tier.requirements}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {bonus.additional_info && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Additional Information
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {bonus.additional_info}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}

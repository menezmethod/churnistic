import { Box, Typography, Paper, Stack, alpha, useTheme, Grid } from '@mui/material';
import { motion } from 'framer-motion';

import { FirestoreOpportunity } from '@/types/opportunity';

interface BonusTiersSectionProps {
  opportunity: FirestoreOpportunity;
}

export const BonusTiersSection = ({ opportunity }: BonusTiersSectionProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!opportunity.bonus?.tiers || opportunity.bonus.tiers.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Bonus Tiers
      </Typography>
      <Stack spacing={2}>
        {opportunity.bonus.tiers.map((tier, index) => (
          <Paper
            key={index}
            elevation={0}
            component={motion.div}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            sx={{
              p: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: isDark
                ? alpha(theme.palette.background.paper, 0.4)
                : alpha(theme.palette.background.paper, 0.7),
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateX(8px)',
                bgcolor: isDark
                  ? alpha(theme.palette.primary.main, 0.05)
                  : alpha(theme.palette.primary.main, 0.02),
                borderColor: 'primary.main',
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mb: 2,
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '1.2rem',
                }}
              >
                {index + 1}
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {tier.level}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tier {index + 1}
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Value
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ color: 'primary.main', fontWeight: 600 }}
                  >
                    ${tier.value.toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Minimum Deposit
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    ${tier.minimum_deposit.toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Requirements
                  </Typography>
                  <Typography>{tier.requirements}</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

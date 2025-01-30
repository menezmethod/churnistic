import { AccountBalance, CalendarToday, Payment } from '@mui/icons-material';
import { Box, Typography, Paper, alpha, useTheme, Grid, Stack } from '@mui/material';
import { motion } from 'framer-motion';

import { FirestoreOpportunity } from '@/types/opportunity';

interface AccountDetailsSectionProps {
  details?: FirestoreOpportunity['details'];
  type: FirestoreOpportunity['type'];
}

export default function AccountDetailsSection({ details }: AccountDetailsSectionProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!details) return null;

  const detailItems = [
    {
      icon: <AccountBalance />,
      label: 'Account Type',
      value: details.account_type,
      highlight: false,
    },
    {
      icon: <Payment />,
      label: 'Monthly Fees',
      value: details.monthly_fees?.amount?.startsWith('$') ? details.monthly_fees.amount : `$${details.monthly_fees?.amount}`,
      highlight: details.monthly_fees?.amount === 'None',
      subtext: details.monthly_fees?.waiver_details,
    },
    {
      icon: <CalendarToday />,
      label: 'Offer Expires',
      value:
        details.expiration && !isNaN(new Date(details.expiration).getTime())
          ? new Date(details.expiration).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : 'No Expiration Date',
      highlight: false,
      warning: true,
    },
  ].filter((item) => item.value);

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
                <Typography variant="subtitle2" color="text.secondary">
                  {item.label}
                </Typography>
              </Stack>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 500,
                  color: item.highlight ? 'success.main' : 'text.primary',
                  flex: 1,
                }}
              >
                {item.value}
              </Typography>
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
'use client';

import {
  AccountBalance as BankIcon,
  CreditCard as CreditCardIcon,
  ShowChart as ShowChartIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import { Paper, Stack, Typography, alpha, useTheme } from '@mui/material';

interface DistributionStatsProps {
  stats: {
    byType: {
      bank: number;
      credit_card: number;
      brokerage: number;
    };
    highValue: number;
  };
}

export const DistributionStats = ({ stats }: DistributionStatsProps) => {
  const theme = useTheme();

  const items = [
    {
      icon: BankIcon,
      label: 'Bank Offers',
      value: stats.byType.bank,
      color: theme.palette.success.main,
    },
    {
      icon: CreditCardIcon,
      label: 'Credit Card Offers',
      value: stats.byType.credit_card,
      color: theme.palette.info.main,
    },
    {
      icon: ShowChartIcon,
      label: 'Brokerage Offers',
      value: stats.byType.brokerage,
      color: theme.palette.secondary.main,
    },
    {
      icon: AttachMoneyIcon,
      label: 'High Value ($500+)',
      value: stats.highValue,
      color: theme.palette.error.main,
    },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.background.paper, 0.6),
      }}
    >
      <Typography
        variant="h6"
        fontWeight="500"
        sx={{
          mb: { xs: 1.5, sm: 2 },
          fontSize: { xs: '1rem', sm: '1.25rem' },
        }}
      >
        Distribution
      </Typography>
      <Stack spacing={{ xs: 1.5, sm: 2 }}>
        {items.map((item) => (
          <Stack
            key={item.label}
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <item.icon sx={{ fontSize: 20, color: item.color }} />
              <Typography>{item.label}</Typography>
            </Stack>
            <Typography fontWeight="500">{item.value}</Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
};

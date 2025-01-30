import {
  TrendingUp as TrendingUpIcon,
  PendingActions as PendingIcon,
  Speed as SpeedIcon,
  AttachMoney as ValueIcon,
  AccountBalance as BankIcon,
  CreditCard as CardIcon,
  ShowChart as BrokerageIcon,
} from '@mui/icons-material';
import { Grid, Fade, useTheme } from '@mui/material';

import { StatsCard } from './StatsCard';
import { OpportunityStats } from '../types/opportunity';

interface StatsGridProps {
  stats: OpportunityStats;
}

export const StatsGrid = ({ stats }: StatsGridProps) => {
  const theme = useTheme();
  const processingSpeed =
    stats.total > 0
      ? (((stats.approved + stats.rejected) / stats.total) * 100).toFixed(1)
      : '0';

  const mainStats = [
    {
      title: 'Total Opportunities',
      value: stats.total,
      icon: <TrendingUpIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />,
      color: theme.palette.primary.main,
    },
    {
      title: 'Pending Review',
      value: stats.pending,
      icon: <PendingIcon sx={{ color: theme.palette.warning.main, fontSize: 28 }} />,
      color: theme.palette.warning.main,
    },
    {
      title: 'Processing Rate',
      value: Number(processingSpeed),
      icon: <SpeedIcon sx={{ color: theme.palette.info.main, fontSize: 28 }} />,
      color: theme.palette.info.main,
      suffix: '%',
    },
    {
      title: 'Avg. Bonus Value',
      value: stats.avgValue,
      icon: <ValueIcon sx={{ color: theme.palette.success.main, fontSize: 28 }} />,
      color: theme.palette.success.main,
      prefix: '$',
    },
  ];

  const typeStats = [
    {
      title: 'Bank Offers',
      value: stats.byType.bank,
      icon: <BankIcon sx={{ color: theme.palette.success.main, fontSize: 28 }} />,
      color: theme.palette.success.main,
    },
    {
      title: 'Credit Card Offers',
      value: stats.byType.credit_card,
      icon: <CardIcon sx={{ color: theme.palette.info.main, fontSize: 28 }} />,
      color: theme.palette.info.main,
    },
    {
      title: 'Brokerage Offers',
      value: stats.byType.brokerage,
      icon: <BrokerageIcon sx={{ color: theme.palette.secondary.main, fontSize: 28 }} />,
      color: theme.palette.secondary.main,
    },
    {
      title: 'High Value ($500+)',
      value: stats.highValue,
      icon: <ValueIcon sx={{ color: theme.palette.error.main, fontSize: 28 }} />,
      color: theme.palette.error.main,
    },
  ];

  return (
    <>
      {/* Main Stats */}
      {mainStats.map((stat, index) => (
        <Grid item xs={12} md={3} key={`main-stat-${index}`}>
          <Fade in timeout={300}>
            <div>
              <StatsCard {...stat} />
            </div>
          </Fade>
        </Grid>
      ))}

      {/* Type Stats */}
      {typeStats.map((stat, index) => (
        <Grid item xs={12} md={3} key={`type-stat-${index}`}>
          <Fade in timeout={300}>
            <div>
              <StatsCard {...stat} />
            </div>
          </Fade>
        </Grid>
      ))}
    </>
  );
};

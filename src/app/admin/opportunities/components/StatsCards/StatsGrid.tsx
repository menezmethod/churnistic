'use client';

import {
  TrendingUp as TrendingUpIcon,
  AccountBalance as BankIcon,
  CreditCard as CardIcon,
  PendingActions as PendingIcon,
  ShowChart as BrokerageIcon,
  AttachMoney as ValueIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { Grid, Fade, useTheme } from '@mui/material';

import { StatsCard } from '@/app/admin/opportunities/components/StatsCards/StatsCard';

interface StatsGridProps {
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    avgValue: number;
    highValue: number;
    byType: {
      bank: number;
      credit_card: number;
      brokerage: number;
    };
  };
}

export const StatsGrid = ({ stats }: StatsGridProps) => {
  const theme = useTheme();

  const processingSpeed =
    stats.total > 0
      ? (((stats.approved + stats.rejected) / stats.total) * 100).toFixed(1)
      : '0';

  return (
    <Grid container spacing={3}>
      {/* Main Stats */}
      <Grid item xs={12} md={3}>
        <Fade in timeout={300}>
          <div>
            <StatsCard
              title="Total Opportunities"
              value={stats.total}
              icon={
                <TrendingUpIcon
                  sx={{ color: theme.palette.primary.main, fontSize: 28 }}
                />
              }
              color={theme.palette.primary.main}
            />
          </div>
        </Fade>
      </Grid>
      <Grid item xs={12} md={3}>
        <Fade in timeout={300}>
          <div>
            <StatsCard
              title="Pending Review"
              value={stats.pending}
              icon={
                <PendingIcon sx={{ color: theme.palette.warning.main, fontSize: 28 }} />
              }
              color={theme.palette.warning.main}
            />
          </div>
        </Fade>
      </Grid>
      <Grid item xs={12} md={3}>
        <Fade in timeout={300}>
          <div>
            <StatsCard
              title="Processing Rate"
              value={Number(processingSpeed)}
              icon={<SpeedIcon sx={{ color: theme.palette.info.main, fontSize: 28 }} />}
              color={theme.palette.info.main}
              suffix="%"
            />
          </div>
        </Fade>
      </Grid>
      <Grid item xs={12} md={3}>
        <Fade in timeout={300}>
          <div>
            <StatsCard
              title="Avg. Bonus Value"
              value={stats.avgValue}
              icon={
                <ValueIcon sx={{ color: theme.palette.success.main, fontSize: 28 }} />
              }
              color={theme.palette.success.main}
              prefix="$"
            />
          </div>
        </Fade>
      </Grid>

      {/* Offer Type Distribution */}
      <Grid item xs={12} md={3}>
        <Fade in timeout={300}>
          <div>
            <StatsCard
              title="Bank Offers"
              value={stats.byType.bank}
              icon={<BankIcon sx={{ color: theme.palette.success.main, fontSize: 28 }} />}
              color={theme.palette.success.main}
            />
          </div>
        </Fade>
      </Grid>
      <Grid item xs={12} md={3}>
        <Fade in timeout={300}>
          <div>
            <StatsCard
              title="Credit Card Offers"
              value={stats.byType.credit_card}
              icon={<CardIcon sx={{ color: theme.palette.info.main, fontSize: 28 }} />}
              color={theme.palette.info.main}
            />
          </div>
        </Fade>
      </Grid>
      <Grid item xs={12} md={3}>
        <Fade in timeout={300}>
          <div>
            <StatsCard
              title="Brokerage Offers"
              value={stats.byType.brokerage}
              icon={
                <BrokerageIcon
                  sx={{ color: theme.palette.secondary.main, fontSize: 28 }}
                />
              }
              color={theme.palette.secondary.main}
            />
          </div>
        </Fade>
      </Grid>
      <Grid item xs={12} md={3}>
        <Fade in timeout={300}>
          <div>
            <StatsCard
              title="High Value ($500+)"
              value={stats.highValue}
              icon={<ValueIcon sx={{ color: theme.palette.error.main, fontSize: 28 }} />}
              color={theme.palette.error.main}
            />
          </div>
        </Fade>
      </Grid>
    </Grid>
  );
};

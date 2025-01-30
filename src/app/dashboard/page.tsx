'use client';

import {
  MonetizationOn as MonetizationOnIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  IconButton,
  Link,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';

import { OpportunityCard, OpportunityCardSkeleton } from './components/OpportunityCard';
import { ProgressCard, ProgressCardSkeleton } from './components/ProgressCard';
import QuickActions from './components/QuickActions';
import RecentActivity from './components/RecentActivity';
import { StatCard, StatCardSkeleton } from './components/StatCard';
import WelcomeSection from './components/WelcomeSection';
import { useDashboardData } from './hooks/useDashboardData';

export default function DashboardPage() {
  const theme = useTheme();
  const { user, profile, stats, quickOpportunities, trackedOpportunities, loading } =
    useDashboardData();

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
        {/* Stats Section */}
        <Grid container spacing={3} sx={{ mb: { xs: 4, md: 6 } }}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item}>
              <StatCardSkeleton />
            </Grid>
          ))}
        </Grid>

        {/* Quick Opportunities Section */}
        <Box sx={{ mb: { xs: 4, md: 6 } }}>
          <Stack spacing={2}>
            {[1, 2, 3].map((item) => (
              <OpportunityCardSkeleton key={item} />
            ))}
          </Stack>
        </Box>

        {/* Currently Tracking Section */}
        <Box>
          <Stack spacing={2}>
            {[1, 2].map((item) => (
              <ProgressCardSkeleton key={item} />
            ))}
          </Stack>
        </Box>
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  const userName =
    profile?.customDisplayName ||
    profile?.displayName ||
    user?.email?.split('@')[0] ||
    'Churner';

  const statCards = [
    {
      icon: MonetizationOnIcon,
      title: 'TRACKED VALUE',
      value: stats.trackedValue,
      trend: stats.trends.trackedValue,
      color: 'primary' as const,
    },
    {
      icon: TrendingUpIcon,
      title: 'POTENTIAL VALUE',
      value: stats.potentialValue,
      trend: stats.trends.potentialValue,
      color: 'warning' as const,
    },
    {
      icon: AccountBalanceWalletIcon,
      title: 'Active Opportunities',
      value: stats.activeOpportunities,
      trend: stats.trends.activeOpportunities,
      color: 'info' as const,
    },
    {
      icon: CheckCircleIcon,
      title: 'Average Value',
      value: stats.averageValue,
      trend: stats.trends.averageValue,
      color: 'success' as const,
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 }, minHeight: '100vh' }}>
      {/* Welcome Section */}
      <WelcomeSection userName={userName} />

      <Grid container spacing={3}>
        {/* Stats Section */}
        {statCards.map((stat, index) => (
          <Grid
            item
            xs={12}
            md={6}
            lg={3}
            key={stat.title}
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatCard {...stat} />
          </Grid>
        ))}

        {/* Quick Actions */}
        <Grid item xs={12}>
          <QuickActions />
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <RecentActivity />
        </Grid>

        {/* Quick Opportunities and Currently Tracking */}
        <Grid item xs={12}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
              gap: 3,
            }}
          >
            {/* Quick Opportunities */}
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Quick Opportunities
                  </Typography>
                  <Chip
                    label={`${quickOpportunities.length} Available`}
                    size="small"
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      fontWeight: 500,
                      height: 24,
                    }}
                  />
                </Box>
                <Button
                  variant="text"
                  size="small"
                  endIcon={<ArrowForwardIcon />}
                  component={Link}
                  href="/opportunities"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'primary.main',
                      bgcolor: 'transparent',
                      '& .MuiSvgIcon-root': {
                        transform: 'translateX(4px)',
                      },
                    },
                    '& .MuiSvgIcon-root': {
                      transition: 'transform 0.2s',
                    },
                  }}
                >
                  View All
                </Button>
              </Box>
              {quickOpportunities.length > 0 ? (
                <Stack spacing={2}>
                  {quickOpportunities.map((opp) => {
                    const transformedOpp = {
                      ...opp,
                      type:
                        opp.type === 'bank_account'
                          ? 'bank_account'
                          : (opp.type as 'credit_card' | 'bank_account'),
                    };
                    return <OpportunityCard key={opp.id} opportunity={transformedOpp} />;
                  })}
                </Stack>
              ) : (
                <Box
                  sx={{
                    p: 4,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.1),
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Quick Opportunities Available
                  </Typography>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    Start exploring new opportunities to maximize your rewards!
                  </Typography>
                  <Button
                    variant="contained"
                    component={Link}
                    href="/opportunities"
                    sx={{ mt: 2 }}
                    endIcon={<ArrowForwardIcon />}
                  >
                    Explore Opportunities
                  </Button>
                </Box>
              )}
            </Box>

            {/* Currently Tracking */}
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Currently Tracking
                  </Typography>
                  <Chip
                    label={`${trackedOpportunities.length} Active`}
                    size="small"
                    component={Link}
                    href="/track"
                    clickable
                    sx={{
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      color: 'success.main',
                      fontWeight: 500,
                      height: 24,
                      textDecoration: 'none',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.success.main, 0.2),
                      },
                    }}
                  />
                </Box>
                <IconButton
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'primary.main',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      transform: 'rotate(180deg)',
                    },
                    transition: 'all 0.3s',
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Box>
              {trackedOpportunities.length > 0 ? (
                <Stack spacing={2}>
                  {trackedOpportunities.map((opp) => (
                    <ProgressCard key={opp.id} opportunity={opp} />
                  ))}
                </Stack>
              ) : (
                <Box
                  sx={{
                    p: 4,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.05),
                    border: '1px solid',
                    borderColor: alpha(theme.palette.success.main, 0.1),
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Tracked Opportunities
                  </Typography>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    Start tracking opportunities to monitor your progress!
                  </Typography>
                  <Button
                    variant="contained"
                    color="success"
                    component={Link}
                    href="/track"
                    sx={{ mt: 2 }}
                    endIcon={<ArrowForwardIcon />}
                  >
                    Start Tracking
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}

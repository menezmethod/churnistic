'use client';

import { KeyboardArrowRight } from '@mui/icons-material';
import {
  Box,
  Button,
  Container,
  Grid,
  LinearProgress,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useDashboardData } from '@/app/dashboard/hooks/useDashboardData';
import OpportunityCard from '@/app/opportunities/components/OpportunityCard';
import { useAuth } from '@/lib/auth/AuthContext';
import type { FirestoreOpportunity } from '@/types/opportunity';

const formatCurrency = (value: number | string | undefined): string => {
  if (!value) return '$0';
  const numericValue =
    typeof value === 'string' ? parseFloat(value.replace(/[$,]/g, '')) : value;
  return isNaN(numericValue) ? '$0' : `$${numericValue.toLocaleString()}`;
};

export default function HomePage() {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const { stats, quickOpportunities, loading: dashboardLoading } = useDashboardData();

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading || dashboardLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <LinearProgress />
      </Box>
    );
  }

  // Calculate real stats from dashboard data
  const realStats = [
    {
      label: 'POTENTIAL BONUS EARNINGS',
      value: formatCurrency(stats?.potentialValue || 0),
    },
    {
      label: 'BONUSES AVAILABLE',
      value: `${quickOpportunities?.length || 0}+`,
    },
    {
      label: 'AVERAGE BONUS VALUE',
      value: formatCurrency(stats?.averageValue || 0),
    },
  ];

  // Get top offers from each category
  const getTopOffersByType = (type: 'credit_card' | 'bank' | 'brokerage') => {
    return quickOpportunities
      ?.filter((opp) => {
        if (type === 'bank') {
          return opp.type === 'bank_account';
        }
        return opp.type === type;
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
  };

  const transformOpportunity = (opp: {
    id: string;
    value: number;
    title: string;
    type: string;
    bank: string;
    description: string;
    requirements: string[];
    status: 'active' | 'inactive';
    source: string;
    sourceLink: string;
    postedDate: string;
    expirationDate?: string;
    confidence: number;
  }): FirestoreOpportunity => {
    let transformedType: 'credit_card' | 'bank' | 'brokerage';
    if (opp.type === 'bank_account') {
      transformedType = 'bank';
    } else if (opp.type === 'credit_card' || opp.type === 'brokerage') {
      transformedType = opp.type;
    } else {
      transformedType = 'credit_card';
    }

    return {
      ...opp,
      type: transformedType,
      name: opp.title || '',
      offer_link: opp.sourceLink || '',
    };
  };

  const featuredOffers = [
    ...(getTopOffersByType('credit_card') || []),
    ...(getTopOffersByType('bank') || []),
    ...(getTopOffersByType('brokerage') || []),
  ].map(transformOpportunity);

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      sx={{
        minHeight: '100vh',
        bgcolor: theme.palette.mode === 'dark' ? 'background.default' : 'grey.50',
        pb: 8,
      }}
    >
      {/* Hero Section */}
      <Container maxWidth="lg">
        <Box
          sx={{
            pt: { xs: 8, md: 12 },
            pb: { xs: 8, md: 12 },
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h2"
            component={motion.h1}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            sx={{
              mb: 3,
              fontWeight: 700,
              color: theme.palette.mode === 'dark' ? 'grey.300' : 'grey.800',
            }}
          >
            Track Your Rewards Journey
          </Typography>
          <Typography
            variant="h5"
            component={motion.h2}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            color="text.secondary"
            sx={{ mb: 4, maxWidth: '800px', mx: 'auto' }}
          >
            Banks offer hundreds of sign-up bonuses. We help you find and track the best
            ones.
          </Typography>
          {!user && (
            <Stack
              component={motion.div}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="center"
              sx={{ mb: 8 }}
            >
              <Button
                variant="contained"
                size="large"
                component={Link}
                href="/auth/signup"
                endIcon={<KeyboardArrowRight />}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                  boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.25)}`,
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 6px 12px ${alpha(theme.palette.primary.main, 0.35)}`,
                    background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                  },
                }}
              >
                Get Started
              </Button>
              <Button
                variant="outlined"
                size="large"
                component={Link}
                href="/auth/signin"
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  borderWidth: 2,
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
                  },
                }}
              >
                Sign In
              </Button>
            </Stack>
          )}

          {/* Stats Section */}
          <Grid container spacing={4} justifyContent="center" sx={{ mb: 8 }}>
            {realStats.map((stat, index) => (
              <Grid
                item
                xs={12}
                sm={4}
                key={stat.label}
                component={motion.div}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: theme.shadows[1],
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[4],
                    },
                  }}
                >
                  <Typography
                    variant="h4"
                    sx={{
                      mb: 1,
                      fontWeight: 700,
                      color: 'primary.main',
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ fontWeight: 500 }}
                  >
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Featured Offers */}
          <Typography
            variant="h4"
            component={motion.h3}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            sx={{ mb: 4, fontWeight: 700 }}
          >
            Featured Offers
          </Typography>
          {featuredOffers.length > 0 ? (
            <Grid container spacing={4} sx={{ mb: 8 }}>
              {featuredOffers.map((offer, index) => (
                <Grid
                  item
                  xs={12}
                  md={4}
                  key={offer.id}
                  component={motion.div}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                >
                  <OpportunityCard
                    opportunity={offer}
                    isDeleting={false}
                    onDeleteOpportunityAction={() => {}}
                    viewMode="grid"
                    index={index}
                    sx={{
                      height: '100%',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[4],
                      },
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box
              sx={{
                p: 4,
                mb: 8,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                border: '1px solid',
                borderColor: alpha(theme.palette.primary.main, 0.1),
                textAlign: 'center',
              }}
            >
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Featured Offers Available
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Check back soon for exciting new opportunities!
              </Typography>
            </Box>
          )}

          {/* CTA Section - Only show for non-authenticated users */}
          {!user && (
            <Box
              component={motion.div}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              sx={{
                p: 4,
                borderRadius: 4,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: theme.shadows[1],
                position: 'relative',
                overflow: 'hidden',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `radial-gradient(circle at top right, ${alpha(
                    theme.palette.primary.main,
                    0.1
                  )}, transparent 70%)`,
                  opacity: 0,
                  transition: 'opacity 0.3s',
                },
                '&:hover::after': {
                  opacity: 1,
                },
              }}
            >
              <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
                Ready to get started?
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Join thousands of users maximizing their rewards
              </Typography>
              <Button
                variant="contained"
                size="large"
                component={Link}
                href="/auth/signup"
                endIcon={<KeyboardArrowRight />}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                  boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.25)}`,
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 6px 12px ${alpha(theme.palette.primary.main, 0.35)}`,
                    background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                  },
                }}
              >
                Get Started Now
              </Button>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}

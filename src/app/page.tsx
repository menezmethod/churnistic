'use client';

import {
  KeyboardArrowRight,
  CreditCard,
  AccountBalance,
  TrendingUp,
  ArrowForward,
  CheckCircle,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Container,
  Grid,
  Stack,
  Typography,
  alpha,
  useTheme,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useInView } from 'react-intersection-observer';

import { useDashboardData } from '@/app/dashboard/hooks/useDashboardData';
import { useAuth } from '@/lib/auth/AuthContext';
import type { FirestoreOpportunity } from '@/types/opportunity';

// Replace the User interface with the actual AuthUser type from your auth context
type AuthUser = ReturnType<typeof useAuth>['user'];

function HeroSection({ user }: { user: AuthUser }) {
  const theme = useTheme();
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <Box
      ref={ref}
      sx={{
        position: 'relative',
        minHeight: '90vh',
        display: 'flex',
        alignItems: 'center',
        background: `linear-gradient(135deg, 
          ${alpha(theme.palette.primary.dark, 0.95)} 0%,
          ${alpha(theme.palette.primary.main, 0.9)} 100%)`,
        overflow: 'hidden',
      }}
    >
      {/* Animated background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          zIndex: 0,
        }}
      >
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.5, 1],
              x: [0, 100, 0],
              y: [0, -50, 0],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              position: 'absolute',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha(theme.palette.primary.light, 0.2)} 0%, transparent 70%)`,
              left: `${i * 25}%`,
              top: `${i * 15}%`,
            }}
          />
        ))}
      </Box>

      {/* Content */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={7}>
            <AnimatePresence>
              {inView && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Typography
                      variant="h1"
                      sx={{
                        fontSize: { xs: '2.5rem', md: '3.5rem' },
                        fontWeight: 800,
                        color: 'common.white',
                        mb: 3,
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      }}
                    >
                      Track Your Rewards Journey
                    </Typography>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <Typography
                      variant="h5"
                      sx={{
                        color: 'common.white',
                        mb: 4,
                        opacity: 0.9,
                        maxWidth: '600px',
                      }}
                    >
                      Banks offer hundreds of sign-up bonuses. We help you find and track
                      the best ones.
                    </Typography>
                  </motion.div>

                  {!user && (
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                    >
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <Button
                          variant="contained"
                          size="large"
                          component={Link}
                          href="/auth/signup"
                          endIcon={<KeyboardArrowRight />}
                          sx={{
                            px: 4,
                            py: 2,
                            borderRadius: 3,
                            textTransform: 'none',
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            bgcolor: 'common.white',
                            color: 'primary.main',
                            '&:hover': {
                              bgcolor: alpha(theme.palette.common.white, 0.9),
                              transform: 'translateY(-2px)',
                              boxShadow: `0 8px 20px ${alpha(theme.palette.common.black, 0.25)}`,
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
                            py: 2,
                            borderRadius: 3,
                            textTransform: 'none',
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            borderColor: 'common.white',
                            color: 'common.white',
                            '&:hover': {
                              borderColor: 'common.white',
                              bgcolor: alpha(theme.palette.common.white, 0.1),
                            },
                          }}
                        >
                          Sign In
                        </Button>
                      </Stack>
                    </motion.div>
                  )}
                </>
              )}
            </AnimatePresence>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

const formatCurrency = (value: number | string | undefined): string => {
  if (!value) return '$0';
  const numericValue =
    typeof value === 'string' ? parseFloat(value.replace(/[$,]/g, '')) : value;
  return isNaN(numericValue) ? '$0' : `$${numericValue.toLocaleString()}`;
};

function StatsSection({ stats }: { stats: Array<{ label: string; value: string }> }) {
  const theme = useTheme();
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <Container maxWidth="lg" sx={{ py: 8 }} ref={ref}>
      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid item xs={12} md={4} key={stat.label}>
            <AnimatePresence>
              {inView && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                >
                  <Box
                    sx={{
                      p: 4,
                      height: '100%',
                      borderRadius: 4,
                      position: 'relative',
                      overflow: 'hidden',
                      bgcolor: 'background.paper',
                      boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 12px 48px ${alpha(theme.palette.primary.main, 0.2)}`,
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                      },
                    }}
                  >
                    <Typography
                      variant="h3"
                      sx={{
                        mb: 2,
                        fontWeight: 700,
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 500,
                        color: 'text.secondary',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {stat.label}
                    </Typography>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

// Add these mock requirements based on offer type
const getOfferRequirements = (type: string): string[] => {
  switch (type) {
    case 'credit_card':
      return [
        'Minimum credit score of 680',
        'No new credit cards in last 24 months',
        '$3,000 spend in first 3 months',
        'Annual fee: $95 (waived first year)',
      ];
    case 'bank':
      return [
        'Direct deposit of $5,000+ within 90 days',
        'Maintain $1,500 minimum balance',
        'Keep account open for 6 months',
        'Available in 48 states',
      ];
    case 'brokerage':
      return [
        'Deposit $5,000+ in new funds',
        'Hold funds for 3 months',
        'First-time customers only',
        'Valid SSN required',
      ];
    default:
      return [];
  }
};

export default function HomePage() {
  const theme = useTheme();
  const { user } = useAuth();
  const { stats, quickOpportunities } = useDashboardData();

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

    // Instead of using getOfferRequirements, let's check what's in the original data
    console.log('Original requirements:', opp.requirements);

    // Only use getOfferRequirements if no requirements exist
    const requirements = opp.requirements?.length
      ? opp.requirements
      : getOfferRequirements(transformedType);

    console.log('Final requirements:', requirements);

    return {
      ...opp,
      type: transformedType,
      name: opp.title || '',
      offer_link: opp.sourceLink || '',
      requirements,
      metadata: {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'system',
        status: opp.status,
      },
    };
  };

  const featuredOffers = [
    ...(getTopOffersByType('credit_card') || []),
    ...(getTopOffersByType('bank') || []),
    ...(getTopOffersByType('brokerage') || []),
  ].map(transformOpportunity);

  console.log('Quick Opportunities:', quickOpportunities); // Check raw data
  console.log('Featured Offers:', featuredOffers); // Check transformed data

  return (
    <Box component="main">
      <HeroSection user={user} />
      <StatsSection stats={realStats} />
      <Container maxWidth="lg">
        {/* Featured Offers */}
        <Box
          component={motion.div}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          sx={{ mb: 8 }}
        >
          <Typography
            variant="h4"
            sx={{
              mb: 3,
              fontWeight: 700,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Featured Offers
          </Typography>

          <Typography
            variant="subtitle1"
            sx={{ mb: 4, color: 'text.secondary' }}
            component={motion.p}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Discover our hand-picked selection of top-rated financial opportunities
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
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      height: '100%',
                      borderRadius: 4,
                      overflow: 'hidden',
                      bgcolor: 'background.default',
                      backdropFilter: 'blur(20px)',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 20px 80px ${alpha(theme.palette.primary.main, 0.2)}`,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        '& .offer-details': {
                          opacity: 1,
                        },
                        '& .offer-overlay': {
                          opacity: 0.15,
                        },
                      },
                    }}
                  >
                    {/* Animated background overlay */}
                    <Box
                      className="offer-overlay"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: 0.08,
                        transition: 'opacity 0.3s ease-in-out',
                        background: `radial-gradient(circle at top right, 
                          ${theme.palette.primary.main}, 
                          transparent 70%
                        )`,
                      }}
                    />

                    <Box sx={{ p: 4, position: 'relative' }}>
                      {/* Value Badge */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 24,
                          right: 24,
                          px: 2,
                          py: 1,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                        }}
                      >
                        <Typography
                          variant="h5"
                          sx={{
                            fontWeight: 700,
                            color: theme.palette.success.main,
                            textShadow: `0 2px 4px ${alpha(theme.palette.success.main, 0.2)}`,
                          }}
                        >
                          ${offer.value}
                        </Typography>
                      </Box>

                      {/* Institution Icon and Type */}
                      <Stack
                        direction="row"
                        spacing={3}
                        alignItems="center"
                        sx={{ mb: 4 }}
                      >
                        <Box
                          sx={{
                            width: 64,
                            height: 64,
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: alpha(
                              offer.type === 'credit_card'
                                ? theme.palette.error.main
                                : offer.type === 'bank'
                                  ? theme.palette.info.main
                                  : theme.palette.success.main,
                              0.1
                            ),
                            border: `1px solid ${alpha(
                              offer.type === 'credit_card'
                                ? theme.palette.error.main
                                : offer.type === 'bank'
                                  ? theme.palette.info.main
                                  : theme.palette.success.main,
                              0.2
                            )}`,
                          }}
                        >
                          {offer.type === 'credit_card' ? (
                            <CreditCard
                              sx={{ fontSize: 32, color: theme.palette.error.main }}
                            />
                          ) : offer.type === 'bank' ? (
                            <AccountBalance
                              sx={{ fontSize: 32, color: theme.palette.info.main }}
                            />
                          ) : (
                            <TrendingUp
                              sx={{ fontSize: 32, color: theme.palette.success.main }}
                            />
                          )}
                        </Box>
                        <Box>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              color: 'text.secondary',
                              textTransform: 'uppercase',
                              fontSize: '0.75rem',
                              letterSpacing: '0.1em',
                              mb: 0.5,
                            }}
                          >
                            {offer.type.replace('_', ' ')}
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            {offer.bank}
                          </Typography>
                        </Box>
                      </Stack>

                      {/* Requirements Preview */}
                      <Box
                        className="offer-details"
                        sx={{
                          opacity: 0.9,
                          transition: 'opacity 0.3s ease-in-out',
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}
                        >
                          Requirements
                        </Typography>
                        <List dense disablePadding>
                          {(offer.requirements || []).map((req, idx) => (
                            <ListItem
                              key={idx}
                              sx={{
                                px: 0,
                                py: 0.5,
                                '&:hover': {
                                  bgcolor: 'transparent',
                                },
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <CheckCircle
                                  sx={{
                                    color: theme.palette.success.main,
                                    fontSize: '1.2rem',
                                  }}
                                />
                              </ListItemIcon>
                              <ListItemText
                                primary={req}
                                primaryTypographyProps={{
                                  variant: 'body2',
                                  color: 'text.secondary',
                                  sx: { fontWeight: 500 },
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>

                      {/* Action Button */}
                      <Button
                        variant="contained"
                        fullWidth
                        component={Link}
                        href={`/opportunities/${offer.id}`}
                        endIcon={<ArrowForward />}
                        sx={{
                          mt: 4,
                          py: 1.5,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontSize: '1rem',
                          fontWeight: 600,
                          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                          '&:hover': {
                            background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                            boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
                          },
                        }}
                      >
                        View Details
                      </Button>
                    </Box>
                  </Box>
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
        </Box>

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
      </Container>
    </Box>
  );
}

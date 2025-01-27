'use client';

import { KeyboardArrowRight } from '@mui/icons-material';
import {
  alpha,
  Box,
  Button,
  Container,
  Grid,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useInView } from 'react-intersection-observer';

import { useDashboardData } from '@/app/dashboard/hooks/useDashboardData';
import { useAuth } from '@/lib/auth/AuthContext';

import { BankLogos } from './components/BankLogos';
import { FAQ } from './components/FAQ';
import { FeaturedOpportunities } from './components/FeaturedOpportunities';
import { useSplashStats } from './hooks/useSplashStats';

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
        minHeight: '70vh',
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
                        fontSize: { xs: '2rem', md: '3rem' },
                        fontWeight: 800,
                        color: 'common.white',
                        mb: 2,
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        textAlign: 'left',
                      }}
                    >
                      Maximize Your Credit Card Rewards
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
                        textAlign: 'left',
                      }}
                    >
                      Smart tracking for credit card sign-up bonuses. Never miss a reward.
                    </Typography>
                  </motion.div>

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
                        Start Free
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
                </>
              )}
            </AnimatePresence>
          </Grid>
          {user && (
            <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'center' }}>
              <AnimatePresence>
                {inView && (
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <Box
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.common.white, 0.1),
                        textAlign: 'center',
                      }}
                    >
                      <Typography
                        variant="h5"
                        color="common.white"
                        fontWeight={600}
                        mb={1}
                      >
                        Welcome Back!
                      </Typography>
                      <Typography
                        variant="body1"
                        color="common.white"
                        sx={{ opacity: 0.8 }}
                        mb={2}
                      >
                        Check out today&apos;s top opportunities below.
                      </Typography>
                      <Button
                        variant="contained"
                        component={Link}
                        href="/dashboard"
                        sx={{
                          px: 3,
                          py: 1,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          bgcolor: theme.palette.secondary.main,
                          '&:hover': {
                            bgcolor: theme.palette.secondary.dark,
                          },
                        }}
                      >
                        Go to Dashboard
                      </Button>
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
}

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

export default function HomePage() {
  const theme = useTheme();
  const { user } = useAuth();
  const { stats: dashboardStats } = useDashboardData();
  const { stats: splashStats } = useSplashStats();

  // Use appropriate stats based on user authentication
  const displayStats = user
    ? [
        {
          label: 'POTENTIAL BONUS EARNINGS',
          value: dashboardStats.potentialValue,
        },
        {
          label: 'BONUSES AVAILABLE',
          value: dashboardStats.activeOpportunities + '+',
        },
        {
          label: 'AVERAGE BONUS VALUE',
          value: dashboardStats.averageValue,
        },
      ]
    : splashStats;

  return (
    <Box component="main">
      <HeroSection user={user} />
      <StatsSection stats={displayStats} />
      <BankLogos />
      <FeaturedOpportunities />
      <Box
        component="section"
        sx={{
          position: 'relative',
          bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50',
          py: { xs: 6, md: 8 },
          borderTop: `1px solid ${theme.palette.divider}`,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <FAQ />
      </Box>
      {!user && (
        <Container maxWidth="lg" sx={{ my: { xs: 6, md: 8 } }}>
          <Box
            component={motion.div}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            sx={{
              p: { xs: 3, md: 6 },
              borderRadius: 4,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: theme.shadows[1],
              position: 'relative',
              overflow: 'hidden',
              textAlign: 'center',
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
            <Typography
              variant="h3"
              sx={{
                mb: 2,
                fontWeight: 800,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              }}
            >
              Ready to Start Earning?
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{
                mb: 4,
                maxWidth: '800px',
                mx: 'auto',
                lineHeight: 1.6,
                fontWeight: 400,
              }}
            >
              Join our community of reward maximizers and start tracking your bonuses
              today.
            </Typography>
            <Button
              variant="contained"
              size="large"
              component={Link}
              href="/auth/signup"
              endIcon={<KeyboardArrowRight />}
              sx={{
                px: 6,
                py: 2,
                borderRadius: 3,
                textTransform: 'none',
                fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' },
                fontWeight: 600,
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
              Create Free Account
            </Button>
          </Box>
        </Container>
      )}
    </Box>
  );
}

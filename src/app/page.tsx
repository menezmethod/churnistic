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
import { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';

import { useAuth } from '@/lib/auth/AuthContext';
import { useSplashStats } from '@/lib/hooks/useSplashStats';

import { BankLogos } from './components/BankLogos';
import { FAQ } from './components/FAQ';
import { FeaturedOpportunities } from './components/FeaturedOpportunities';

// Replace the User interface with the actual AuthUser type from your auth context
type AuthUser = ReturnType<typeof useAuth>['user'];

// Pre-generate random values for animations
const circles = Array.from({ length: 10 }, (_, i) => ({
  width: 100 + i * 20,
  height: 100 + i * 20,
  left: `${(i * 10) % 100}%`,
  top: `${(i * 10 + 5) % 100}%`,
}));

function HeroSection({
  user,
  stats,
}: {
  user: AuthUser;
  stats: Array<{ label: string; value: string }>;
}) {
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
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: `radial-gradient(circle at 20% 20%, 
          ${alpha(theme.palette.primary.dark, 0.95)} 0%,
          ${alpha(theme.palette.primary.main, 0.9)} 100%)`,
        overflow: 'hidden',
      }}
    >
      {/* Enhanced animated background */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          zIndex: 0,
          background: `radial-gradient(circle at 50% 50%, 
            ${alpha(theme.palette.primary.light, 0.1)} 0%, 
            transparent 60%)`,
        }}
      >
        {circles.map((circle, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.5, 1],
              x: [0, 50, 0],
              y: [0, 50, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              width: circle.width,
              height: circle.height,
              borderRadius: '50%',
              background: `radial-gradient(circle, 
                ${alpha(theme.palette.primary.light, 0.2)} 0%, 
                transparent 70%)`,
              left: circle.left,
              top: circle.top,
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
                        fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem', lg: '4rem' },
                        fontWeight: 800,
                        color: 'common.white',
                        mb: 2,
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        textAlign: 'left',
                        lineHeight: 1.2,
                        background: `linear-gradient(45deg, 
                          ${theme.palette.primary.light}, 
                          ${theme.palette.common.white})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Unlock Your Financial Potential
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
                        fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
                        lineHeight: 1.6,
                      }}
                    >
                      Revolutionize how you earn rewards. Our intelligent platform tracks,
                      optimizes, and maximizes every credit card opportunity for you.
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
                  )}
                </>
              )}
            </AnimatePresence>
          </Grid>

          {/* Enhanced Stats Section */}
          <Grid item xs={12} sx={{ mt: { xs: 4, md: 6 } }}>
            <Grid container spacing={2}>
              {stats.map((stat, index) => (
                <Grid item xs={12} sm={6} md={4} key={stat.label}>
                  <AnimatePresence>
                    {inView && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.2 }}
                      >
                        <Box
                          sx={{
                            p: 3,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.common.white, 0.1),
                            textAlign: 'center',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid',
                            borderColor: alpha(theme.palette.common.white, 0.2),
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateY(-5px)',
                              boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                            },
                          }}
                        >
                          <Typography
                            variant="h4"
                            sx={{
                              mb: 1,
                              fontWeight: 700,
                              color: 'common.white',
                              fontSize: { xs: '1.5rem', sm: '2rem' },
                              background: `linear-gradient(45deg, 
                                ${theme.palette.primary.light}, 
                                ${theme.palette.common.white})`,
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
                              color: alpha(theme.palette.common.white, 0.8),
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              fontSize: { xs: '0.8rem', sm: '0.9rem' },
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
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default function HomePage() {
  const theme = useTheme();
  const { user } = useAuth();
  const { stats, error } = useSplashStats();

  // Add error state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      setErrorMessage('Failed to load statistics. Please try again later.');
    }
  }, [error]);

  return (
    <Box component="main">
      {errorMessage && (
        <Box sx={{ p: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography>{errorMessage}</Typography>
        </Box>
      )}

      <HeroSection user={user} stats={stats || []} />
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

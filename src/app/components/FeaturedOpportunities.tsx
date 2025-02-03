'use client';

import { CheckCircle } from '@mui/icons-material';
import {
  alpha,
  Box,
  Button,
  Container,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useInView } from 'react-intersection-observer';

import { LogoImage } from '@/app/opportunities/components/LogoImage';
import { getTypeColors } from '@/app/opportunities/utils/colorUtils';
import { useOpportunities } from '@/lib/hooks/useOpportunities';
import { formatCurrency } from '@/lib/utils/formatters';
import { FirestoreOpportunity } from '@/types/opportunity';

export function FeaturedOpportunities() {
  const theme = useTheme();
  const [ref] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });
  const { opportunities } = useOpportunities({ limit: 100 });

  // Get top 3 opportunities with highest value
  const featuredOffers = opportunities
    .sort(
      (a: FirestoreOpportunity, b: FirestoreOpportunity) =>
        (b.value || 0) - (a.value || 0)
    )
    .slice(0, 3);

  return (
    <Container maxWidth="lg" sx={{ mb: 8 }}>
      <Box
        component={motion.div}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        sx={{ py: 4 }}
        ref={ref}
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
          <Grid container spacing={4}>
            {featuredOffers.map((offer: FirestoreOpportunity, index: number) => {
              const colors = getTypeColors(offer.type, theme);
              return (
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
                      height: '100%',
                      p: 3,
                      borderRadius: 3,
                      bgcolor:
                        theme.palette.mode === 'dark'
                          ? alpha(theme.palette.background.paper, 0.6)
                          : 'background.paper',
                      border: '1px solid',
                      borderColor:
                        theme.palette.mode === 'dark'
                          ? alpha(theme.palette.divider, 0.1)
                          : 'divider',
                      position: 'relative',
                      transition: 'all 0.3s',
                      overflow: 'hidden',
                      backdropFilter: 'blur(8px)',
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[4],
                        '& .delete-button': {
                          opacity: 1,
                        },
                        '& .card-icon': {
                          transform: 'scale(1.1) rotate(5deg)',
                        },
                        '&::before': {
                          transform: 'translateX(0)',
                        },
                        '&::after': {
                          opacity: 1,
                        },
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: 4,
                        height: '100%',
                        background: `linear-gradient(to bottom, ${colors.primary}, ${colors.light})`,
                        transform: 'translateX(-4px)',
                        transition: 'transform 0.3s',
                        pointerEvents: 'none',
                        zIndex: 0,
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `radial-gradient(circle at top right, ${alpha(
                          colors.primary,
                          0.12
                        )}, transparent 70%)`,
                        opacity: 0,
                        transition: 'opacity 0.3s',
                        pointerEvents: 'none',
                        zIndex: 0,
                      },
                    }}
                  >
                    <Box sx={{ position: 'relative', mb: 2, zIndex: 1 }}>
                      <Box
                        className="card-icon"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: colors.alpha,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mb: 2,
                          transition: 'transform 0.3s',
                          position: 'relative',
                          height: 80,
                          width: '100%',
                          overflow: 'hidden',
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: `radial-gradient(circle at top right, ${alpha(
                              colors.primary,
                              0.12
                            )}, transparent 70%)`,
                            opacity: 0,
                            transition: 'opacity 0.3s',
                          },
                          '&:hover::after': {
                            opacity: 1,
                          },
                        }}
                      >
                        <LogoImage logo={offer.logo} name={offer.name} colors={colors} />
                      </Box>
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {offer.name}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {offer.type.replace('_', ' ').toUpperCase()}
                    </Typography>

                    <Typography
                      variant="h5"
                      sx={{ color: colors.primary, fontWeight: 600, mb: 2 }}
                    >
                      {formatCurrency(offer.value)}
                    </Typography>

                    {offer.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {offer.description}
                      </Typography>
                    )}

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
                        {(
                          offer.bonus?.requirements?.[0]?.description?.split('\n') || []
                        ).map((req: string, idx: number) => (
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
                                  color: colors.primary,
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

                    <Box sx={{ mt: 'auto', display: 'flex', gap: 1 }}>
                      <Link
                        href={`/opportunities/${offer.id}`}
                        style={{ textDecoration: 'none', flexGrow: 1 }}
                      >
                        <Button
                          fullWidth
                          variant="contained"
                          sx={{
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontWeight: 500,
                            background: `linear-gradient(135deg, ${colors.primary}, ${colors.dark})`,
                            boxShadow: `0 4px 8px ${alpha(colors.primary, 0.15)}`,
                            transition: 'all 0.3s',
                            overflow: 'hidden',
                            position: 'relative',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: -100,
                              width: '70px',
                              height: '100%',
                              background: 'rgba(255, 255, 255, 0.2)',
                              transform: 'skewX(-15deg)',
                              transition: 'all 0.6s',
                              filter: 'blur(5px)',
                            },
                            '&:hover': {
                              background: `linear-gradient(135deg, ${colors.dark}, ${colors.primary})`,
                              transform: 'translateY(-1px)',
                              boxShadow: `0 4px 8px ${alpha(colors.primary, 0.15)}`,
                              '&::before': {
                                left: '200%',
                              },
                            },
                          }}
                        >
                          View Details
                        </Button>
                      </Link>
                      {offer.offer_link && (
                        <Button
                          variant="outlined"
                          href={offer.offer_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontWeight: 500,
                            borderColor: alpha(colors.primary, 0.5),
                            color: colors.primary,
                            '&:hover': {
                              borderColor: colors.primary,
                              bgcolor: alpha(colors.primary, 0.04),
                              transform: 'translateY(-1px)',
                            },
                          }}
                        >
                          View Offer
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Box
            sx={{
              p: 4,
              mt: 4,
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
    </Container>
  );
}

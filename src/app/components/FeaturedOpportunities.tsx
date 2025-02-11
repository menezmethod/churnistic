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
import { formatCurrency } from '@/lib/utils/formatters';
import { FirestoreOpportunity } from '@/types/opportunity';

interface FeaturedOpportunitiesProps {
  opportunities: FirestoreOpportunity[];
}

export function FeaturedOpportunities({ opportunities }: FeaturedOpportunitiesProps) {
  const theme = useTheme();
  const [ref] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  // Debug logging for incoming opportunities
  console.log('🔍 FeaturedOpportunities - Raw props:', opportunities);
  console.log('🔍 FeaturedOpportunities - Data check:', {
    isArray: Array.isArray(opportunities),
    length: opportunities?.length,
    firstItem: opportunities?.[0],
    types: opportunities?.map((opp) => opp.type),
    featured: opportunities?.filter((opp) => opp.metadata?.featured).length,
  });

  // Get one featured opportunity per category
  const getFeaturedByCategory = () => {
    const categories = ['credit_card', 'bank', 'brokerage'] as const;

    const result = categories
      .map((category) => {
        const categoryOpportunities = opportunities.filter(
          (opp) => opp.type === category
        );
        console.log(`🎯 Category ${category}:`, {
          found: categoryOpportunities.length,
          opportunities: categoryOpportunities.map((opp) => ({
            id: opp.id,
            name: opp.name,
            type: opp.type,
            featured: opp.metadata?.featured,
          })),
        });

        if (categoryOpportunities.length === 0) return null;

        // Get a random opportunity from the category
        const randomIndex = Math.floor(Math.random() * categoryOpportunities.length);
        return categoryOpportunities[randomIndex];
      })
      .filter(Boolean) as FirestoreOpportunity[];

    return result;
  };

  const featuredOpportunities = getFeaturedByCategory();

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
            background: `linear-gradient(45deg, ${theme.palette.warning.main}, ${theme.palette.warning.light})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center',
          }}
        >
          Featured Opportunities
        </Typography>

        <Typography
          variant="subtitle1"
          sx={{ mb: 6, color: 'text.secondary', textAlign: 'center' }}
          component={motion.p}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Discover our top featured opportunities across different categories
        </Typography>

        {featuredOpportunities.length > 0 ? (
          <Grid container spacing={4}>
            {featuredOpportunities.map((opportunity, index) => {
              const colors = getTypeColors(opportunity.type, theme);
              return (
                <Grid
                  item
                  xs={12}
                  md={4}
                  key={opportunity.id}
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
                      borderColor: alpha(colors.primary, 0.2),
                      position: 'relative',
                      transition: 'all 0.3s',
                      overflow: 'hidden',
                      backdropFilter: 'blur(8px)',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: `0 8px 16px ${alpha(colors.primary, 0.15)}`,
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 12px 24px ${alpha(colors.primary, 0.25)}`,
                        borderColor: alpha(colors.primary, 0.4),
                        '& .card-icon': {
                          transform: 'scale(1.1) rotate(5deg)',
                        },
                        '& .card-gradient': {
                          opacity: 0.2,
                        },
                      },
                    }}
                  >
                    {/* Background gradient */}
                    <Box
                      className="card-gradient"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `radial-gradient(circle at top right, ${colors.primary}, transparent 70%)`,
                        opacity: 0.1,
                        transition: 'opacity 0.3s',
                        zIndex: 0,
                      }}
                    />

                    <Box sx={{ position: 'relative', mb: 2, zIndex: 1 }}>
                      <Box
                        className="card-icon"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: alpha(colors.primary, 0.1),
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
                            background: `linear-gradient(135deg, ${alpha(colors.primary, 0.1)}, transparent)`,
                            opacity: 0.5,
                          },
                        }}
                      >
                        <LogoImage
                          logo={opportunity.logo}
                          name={opportunity.name}
                          colors={colors}
                        />
                      </Box>

                      <Typography
                        variant="caption"
                        sx={{
                          position: 'absolute',
                          top: -10,
                          right: -10,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: alpha(colors.primary, 0.1),
                          color: colors.primary,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          fontSize: '0.75rem',
                          letterSpacing: 0.5,
                          backdropFilter: 'blur(4px)',
                          border: '1px solid',
                          borderColor: alpha(colors.primary, 0.2),
                        }}
                      >
                        {opportunity.type.replace('_', ' ')}
                      </Typography>
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {opportunity.name}
                    </Typography>

                    <Typography
                      variant="h5"
                      sx={{
                        color: theme.palette.success.main,
                        fontWeight: 600,
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        background: `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {formatCurrency(opportunity.value)}
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 400,
                          WebkitTextFillColor: theme.palette.text.secondary,
                        }}
                      >
                        bonus value
                      </Typography>
                    </Typography>

                    {opportunity.description && (
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
                        {opportunity.description}
                      </Typography>
                    )}

                    {opportunity.bonus?.requirements?.[0]?.description && (
                      <Box sx={{ mb: 2, flexGrow: 1 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}
                        >
                          How to Qualify
                        </Typography>
                        <List dense disablePadding>
                          {opportunity.bonus.requirements[0].description
                            .split('\n')
                            .map((req, idx) => (
                              <ListItem
                                key={idx}
                                sx={{
                                  px: 0,
                                  py: 0.5,
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
                    )}

                    <Box sx={{ mt: 'auto', display: 'flex', gap: 1 }}>
                      <Link
                        href={`/opportunities/${opportunity.id}`}
                        style={{ textDecoration: 'none', flexGrow: 1 }}
                      >
                        <Button
                          fullWidth
                          variant="contained"
                          sx={{
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontWeight: 600,
                            bgcolor: colors.primary,
                            color: 'white',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: colors.dark,
                              transform: 'translateY(-2px)',
                              boxShadow: `0 4px 12px ${alpha(colors.primary, 0.4)}`,
                            },
                          }}
                        >
                          View Details
                        </Button>
                      </Link>
                      {opportunity.offer_link && (
                        <Button
                          variant="outlined"
                          href={opportunity.offer_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontWeight: 600,
                            borderColor: alpha(colors.primary, 0.5),
                            color: colors.primary,
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: colors.primary,
                              bgcolor: alpha(colors.primary, 0.08),
                              transform: 'translateY(-2px)',
                              boxShadow: `0 4px 12px ${alpha(colors.primary, 0.15)}`,
                            },
                          }}
                        >
                          Apply Now
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
              bgcolor: alpha(theme.palette.warning.main, 0.05),
              border: '1px solid',
              borderColor: alpha(theme.palette.warning.main, 0.1),
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

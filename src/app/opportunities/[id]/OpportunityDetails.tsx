'use client';

import {
  AccountBalance as AccountBalanceIcon,
  CreditCard as CreditCardIcon,
  Timer as TimerIcon,
  Link as LinkIcon,
  CalendarToday as CalendarTodayIcon,
  Star as StarIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import {
  Box,
  Container,
  Typography,
  Paper,
  Chip,
  useTheme,
  alpha,
  Grid,
  Button,
} from '@mui/material';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';

import { formatCurrency } from '@/utils/formatters';

interface OpportunityDetailsProps {
  opportunity: {
    _id: string;
    id: string;
    institution: string;
    type: 'credit_card' | 'bank_account' | 'brokerage';
    value: number;
    title: string;
    description: string;
    requirements: string[];
    url: string;
    source: {
      name: string;
      url: string;
    };
    metadata: {
      created_at: string;
      last_updated: string;
      version: string;
    };
    created_at: string;
    last_updated: string;
    bonus: {
      amount: number;
      currency: string;
      requirements: string[];
    };
    availability: {
      regions: string[];
      is_nationwide: boolean;
      restrictions: string | null;
    };
    timing: {
      posted_date: string;
      last_verified: string;
      expiration: string;
    };
    offer_link: string;
    status: 'active' | 'expired' | 'pending';
    confidence?: number;
  };
}

const ValueDisplay = ({ value }: { value: string | number }) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const isDark = theme.palette.mode === 'dark';

  // Helper function to safely parse and format the value
  const displayValue = (val: string | number) => {
    if (typeof val === 'number') return formatCurrency(val);
    const numericValue = parseFloat(val.replace(/[$,]/g, ''));
    return isNaN(numericValue) ? '$0' : formatCurrency(numericValue);
  };

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: isHovered
          ? alpha(theme.palette.primary.main, isDark ? 0.5 : 0.3)
          : alpha(theme.palette.divider, isDark ? 0.2 : 0.1),
        background: isHovered
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.primary.light, 0.02)})`
          : 'transparent',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered
          ? `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`
          : 'none',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'transparent',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)}, ${alpha(theme.palette.primary.light, 0.2)})`,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s',
          zIndex: -1,
        },
      }}
    >
      <Typography
        variant="h3"
        component="span"
        sx={{
          fontWeight: 700,
          background: isHovered
            ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.9)}, ${alpha(theme.palette.primary.light, 0.9)})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          transition: 'all 0.3s',
          filter: isHovered ? 'brightness(1.2) contrast(1.1)' : 'none',
          textShadow: isHovered
            ? `0 0 20px ${alpha(theme.palette.primary.main, 0.3)}`
            : 'none',
          letterSpacing: '0.02em',
          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
        }}
      >
        {displayValue(value)}
      </Typography>
      <Box
        component={motion.div}
        animate={{
          x: isHovered ? [0, 4, 0] : 0,
          opacity: isHovered ? 1 : 0,
        }}
        transition={{
          duration: 0.5,
          ease: 'easeInOut',
        }}
      >
        <ArrowForwardIcon
          sx={{
            color: theme.palette.primary.main,
            fontSize: '2rem',
            filter: `drop-shadow(0 0 8px ${alpha(theme.palette.primary.main, 0.4)})`,
          }}
        />
      </Box>
    </Box>
  );
};

const AvailabilitySection = ({
  availability,
}: {
  availability: OpportunityDetailsProps['opportunity']['availability'];
}) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        mb: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        background: 'transparent',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          '&::after': {
            content: '""',
            flex: 1,
            height: 2,
            background: `linear-gradient(90deg, ${alpha(
              theme.palette.primary.main,
              0.3
            )}, transparent)`,
            borderRadius: 1,
          },
        }}
      >
        Availability
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Status
          </Typography>
          <Chip
            label={availability.is_nationwide ? 'Nationwide' : 'Selected States'}
            color={availability.is_nationwide ? 'success' : 'primary'}
            sx={{ fontWeight: 600 }}
          />
        </Box>

        {!availability.is_nationwide && availability.regions.length > 0 && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Available States ({availability.regions.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {availability.regions.map((region) => (
                <Chip
                  key={region}
                  label={region}
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: 'primary.main',
                    fontWeight: 600,
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {availability.restrictions !== null && (
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Restrictions
            </Typography>
            <Typography variant="body2">{availability.restrictions}</Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

const TimingSection = ({
  timing,
}: {
  timing: OpportunityDetailsProps['opportunity']['timing'];
}) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        mb: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        background: 'transparent',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4],
        },
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          '&::after': {
            content: '""',
            flex: 1,
            height: 2,
            background: `linear-gradient(90deg, ${alpha(
              theme.palette.primary.main,
              0.3
            )}, transparent)`,
            borderRadius: 1,
          },
        }}
      >
        Timing
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Posted Date
          </Typography>
          <Chip
            icon={<CalendarTodayIcon />}
            label={new Date(timing.posted_date).toLocaleDateString()}
            sx={{ fontWeight: 600 }}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Last Verified
          </Typography>
          <Chip
            icon={<TimerIcon />}
            label={new Date(timing.last_verified).toLocaleDateString()}
            sx={{ fontWeight: 600 }}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Expiration
          </Typography>
          <Chip
            icon={<TimerIcon />}
            label={new Date(timing.expiration).toLocaleDateString()}
            color="warning"
            sx={{ fontWeight: 600 }}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default function OpportunityDetails({ opportunity }: OpportunityDetailsProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: 4,
        minHeight: '100vh',
      }}
    >
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header Section */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            position: 'relative',
            overflow: 'hidden',
            background: 'transparent',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[8],
              borderColor: alpha(theme.palette.primary.main, isDark ? 0.3 : 0.2),
              '&::after': {
                transform: 'rotate(30deg) translateX(0)',
              },
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.primary.light, 0.02)})`,
              opacity: 0,
              transition: 'opacity 0.3s',
              zIndex: -1,
            },
            '&:hover::before': {
              opacity: 1,
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: -100,
              right: -100,
              width: 200,
              height: 200,
              background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.light, 0.1)})`,
              transform: 'rotate(30deg) translateX(100%)',
              transition: 'transform 0.5s ease-out',
              zIndex: 0,
            },
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'rotate(5deg) scale(1.1)',
                      bgcolor: alpha(theme.palette.primary.main, 0.15),
                    },
                  }}
                >
                  {opportunity.type === 'credit_card' ? (
                    <CreditCardIcon sx={{ fontSize: '2rem', color: 'primary.main' }} />
                  ) : (
                    <AccountBalanceIcon
                      sx={{ fontSize: '2rem', color: 'primary.main' }}
                    />
                  )}
                </Box>
                <Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      mb: 1,
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {opportunity.title}
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      label={opportunity.institution}
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: 'primary.main',
                        fontWeight: 600,
                        border: '1px solid',
                        borderColor: alpha(theme.palette.primary.main, 0.2),
                        transition: 'all 0.3s',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.15),
                          borderColor: alpha(theme.palette.primary.main, 0.3),
                        },
                      }}
                    />
                    <Chip
                      label={opportunity.status}
                      size="small"
                      color={opportunity.status === 'active' ? 'success' : 'default'}
                      sx={{
                        fontWeight: 600,
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                        },
                      }}
                    />
                    {opportunity.confidence !== undefined && (
                      <Chip
                        icon={<StarIcon sx={{ fontSize: '1rem !important' }} />}
                        label={`${opportunity.confidence * 100}% Confidence`}
                        size="small"
                        color="warning"
                      />
                    )}
                  </Box>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: { xs: 'flex-start', md: 'flex-end' },
                  gap: 1,
                }}
              >
                <ValueDisplay value={opportunity.value} />
                <Box display="flex" gap={1}>
                  <Chip
                    icon={<CalendarTodayIcon sx={{ fontSize: '1rem !important' }} />}
                    label={new Date(opportunity.timing.posted_date).toLocaleDateString()}
                    size="small"
                    sx={{
                      bgcolor: alpha(theme.palette.info.main, 0.1),
                      color: 'info.main',
                      fontWeight: 600,
                      border: '1px solid',
                      borderColor: alpha(theme.palette.info.main, 0.2),
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        bgcolor: alpha(theme.palette.info.main, 0.15),
                      },
                    }}
                  />
                  {opportunity.timing.expiration && (
                    <Chip
                      icon={<TimerIcon sx={{ fontSize: '1rem !important' }} />}
                      label={`Expires: ${new Date(opportunity.timing.expiration).toLocaleDateString()}`}
                      size="small"
                      color="warning"
                      sx={{
                        fontWeight: 600,
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                        },
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Description Section */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            background: 'transparent',
            transition: 'all 0.3s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[4],
            },
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              '&::after': {
                content: '""',
                flex: 1,
                height: 2,
                background: `linear-gradient(90deg, ${alpha(
                  theme.palette.primary.main,
                  0.3
                )}, transparent)`,
                borderRadius: 1,
              },
            }}
          >
            Description
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              lineHeight: 1.7,
            }}
          >
            {opportunity.description}
          </Typography>
        </Paper>

        {/* Requirements Section */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            background: 'transparent',
            transition: 'all 0.3s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[4],
            },
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              '&::after': {
                content: '""',
                flex: 1,
                height: 2,
                background: `linear-gradient(90deg, ${alpha(
                  theme.palette.primary.main,
                  0.3
                )}, transparent)`,
                borderRadius: 1,
              },
            }}
          >
            Requirements
          </Typography>
          <Grid container spacing={2}>
            {opportunity.requirements.map((requirement, index) => (
              <Grid
                item
                xs={12}
                key={index}
                component={motion.div}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Box
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    transition: 'all 0.3s',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      borderColor: 'primary.main',
                      transform: 'translateX(8px)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{
                      flex: 1,
                      color: 'text.secondary',
                    }}
                  >
                    {requirement}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Add Availability Section */}
        <AvailabilitySection availability={opportunity.availability} />

        {/* Add Timing Section */}
        <TimingSection timing={opportunity.timing} />

        {/* Source Section - Update to use the correct source structure */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            background: 'transparent',
            transition: 'all 0.3s',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: theme.shadows[4],
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <LinkIcon color="primary" />
              <Typography variant="subtitle1" fontWeight={600}>
                Source: {opportunity.source.name}
              </Typography>
            </Box>
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                endIcon={<ArrowForwardIcon />}
                component="a"
                href={opportunity.source.url}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                View Source
              </Button>
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                component="a"
                href={opportunity.offer_link}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Apply Now
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Back Button */}
        <Box display="flex" justifyContent="center">
          <Button
            component={Link}
            href="/opportunities"
            variant="outlined"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              '&:hover': {
                transform: 'translateY(-2px)',
              },
            }}
          >
            Back to Opportunities
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

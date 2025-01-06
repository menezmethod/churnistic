'use client';

import {
  AccountBalance,
  AccountBalanceWallet,
  ArrowBack,
  AttachMoney,
  CheckCircle,
  CreditCard,
  CreditScore,
  Description,
  Info,
  Layers,
  LocationOn,
  LocalOffer,
  MonetizationOn,
  Public,
  Warning,
  Stars,
} from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Paper,
  Typography,
  alpha,
  useTheme,
  Tooltip,
} from '@mui/material';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React from 'react';

import { useOpportunity } from '@/lib/hooks/useOpportunity';
import { FormData } from '@/types/opportunity';

interface DetailItemProps {
  label: string;
  value: string | number | string[] | React.ReactNode | null | undefined;
  icon: React.ElementType;
  valueStyle?: React.CSSProperties;
}

// Add state name mapping
const STATE_NAMES: { [key: string]: string } = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
  DC: 'District of Columbia',
  PR: 'Puerto Rico',
  VI: 'U.S. Virgin Islands',
};

// Helper function to validate and format state codes
const validateStateCode = (state: string): string | null => {
  const code = state.toUpperCase().trim();

  // Check if it's a valid state code
  if (STATE_NAMES[code]) {
    return code;
  }

  // Check if it's a state name that we can convert to code
  const stateEntry = Object.entries(STATE_NAMES).find(
    ([, name]) => name.toLowerCase() === state.toLowerCase().trim()
  );

  return stateEntry ? stateEntry[0] : null;
};

// Add a smart state display component
const SmartStateChip = ({ state }: { state: string }) => {
  const theme = useTheme();
  const validState = validateStateCode(state);

  // Skip rendering invalid states
  if (!validState) {
    return null;
  }

  const displayName = STATE_NAMES[validState];

  return (
    <Tooltip title={displayName} arrow placement="top">
      <Chip
        label={displayName.length > 12 ? validState : displayName}
        size="small"
        sx={{
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          color: 'primary.main',
          fontWeight: 600,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.15),
            transform: 'translateY(-2px)',
          },
        }}
      />
    </Tooltip>
  );
};

// Add the StateDisplay component
interface StateDisplayProps {
  states: string[];
}

const StateDisplay = ({ states }: StateDisplayProps) => {
  const validStates = React.useMemo(
    () =>
      Array.from(new Set(states))
        .map(validateStateCode)
        .filter((code): code is string => code !== null),
    [states]
  );

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {validStates.map((state) => (
        <SmartStateChip key={state} state={state} />
      ))}
    </Box>
  );
};

const DetailItem: React.FC<DetailItemProps> = ({
  label,
  value,
  icon: Icon,
  valueStyle,
}) => {
  const theme = useTheme();
  if (!value) return null;

  const formatFee = (
    fee: number | { amount: number; waivable: boolean } | string
  ): string => {
    if (typeof fee === 'number') {
      return fee === 0 ? 'No Fee' : `$${fee}`;
    }
    if (typeof fee === 'object' && 'amount' in fee) {
      const { amount, waivable } = fee;
      const feeText = amount === 0 ? 'No Fee' : `$${amount}`;
      return waivable ? `${feeText} (Waivable)` : feeText;
    }
    return String(fee);
  };

  const formatValue = (val: DetailItemProps['value']): string | string[] => {
    if (!val) return '';
    if (typeof val === 'object' && !Array.isArray(val)) {
      if ('amount' in val) {
        return formatFee(val);
      }
      if (React.isValidElement(val)) {
        return 'React Element';
      }
    }
    if (label.toLowerCase().includes('fee') && typeof val !== 'object') {
      return formatFee(val as number | string);
    }
    if (Array.isArray(val)) {
      return val.map(String);
    }
    return String(val);
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      display="flex"
      alignItems="flex-start"
      gap={2}
      mb={2}
    >
      <Box
        sx={{
          p: 1,
          borderRadius: 1,
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at center, ${alpha(theme.palette.primary.main, 0.2)}, transparent)`,
            opacity: 0,
            transition: 'opacity 0.3s',
          },
          '&:hover': {
            transform: 'scale(1.1) rotate(5deg)',
            '&::before': {
              opacity: 1,
            },
          },
        }}
      >
        <Icon />
      </Box>
      <Box flex={1}>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          gutterBottom
          sx={{ fontWeight: 500 }}
        >
          {label}
        </Typography>
        {Array.isArray(value) ? (
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {(formatValue(value) as string[]).map((item: string, index: number) => (
              <Typography
                key={index}
                component="li"
                variant="body2"
                sx={{
                  mb: 1,
                  '&:last-child': { mb: 0 },
                  ...valueStyle,
                }}
              >
                {item}
              </Typography>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" sx={{ fontWeight: 500, ...valueStyle }}>
            {formatValue(value)}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default function OpportunityDetailsPage() {
  const params = useParams<{ id: string }>();
  const { data: opportunity, isLoading, error } = useOpportunity(params.id);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 360],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                border: '3px solid',
                borderColor: 'primary.main',
                borderRightColor: 'transparent',
              }}
            />
          </motion.div>
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              fontWeight: 500,
              textAlign: 'center',
            }}
          >
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Loading opportunity details...
            </motion.span>
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Alert
            severity="error"
            sx={{
              borderRadius: 2,
              boxShadow: theme.shadows[1],
              border: '1px solid',
              borderColor: alpha(theme.palette.error.main, 0.2),
              backdropFilter: 'blur(8px)',
              '& .MuiAlert-icon': {
                fontSize: '2rem',
              },
            }}
          >
            <AlertTitle sx={{ fontSize: '1.2rem' }}>Error Loading Opportunity</AlertTitle>
            {error instanceof Error
              ? error.message
              : 'Failed to load opportunity details'}
          </Alert>
        </motion.div>
      </Container>
    );
  }

  if (!opportunity) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="warning">
          <AlertTitle>Opportunity Not Found</AlertTitle>
          The opportunity you&apos;re looking for doesn&apos;t exist or has been removed.
        </Alert>
      </Container>
    );
  }

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return 'Not specified';
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return format(date, 'MMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const getBonusDetails = () => {
    if (!opportunity.metadata.bonus) return null;

    const getBonusValue = () => {
      const bonus = opportunity.metadata.bonus;
      if (!bonus) return null;

      const bonusValue = bonus.value;
      if (bonusValue === undefined) return null;

      // Format based on type
      switch (opportunity.type) {
        case 'brokerage':
          return `${bonusValue.toLocaleString()} shares of stock`;
        case 'credit_card':
          return `$${bonusValue.toLocaleString()}`;
        case 'bank_account':
        default:
          return `$${bonusValue.toLocaleString()}`;
      }
    };

    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 3,
          borderRadius: 3,
          bgcolor: isDark
            ? alpha(theme.palette.background.paper, 0.6)
            : 'background.paper',
          border: '1px solid',
          borderColor: isDark ? alpha(theme.palette.divider, 0.1) : 'divider',
          transition: 'all 0.3s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[4],
          },
        }}
      >
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: 'primary.main',
            fontWeight: 600,
            mb: 3,
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
          <LocalOffer /> Bonus Details
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <DetailItem
              label="Bonus Value"
              value={getBonusValue()}
              icon={MonetizationOn}
            />
            {opportunity.type === 'credit_card' && (
              <DetailItem
                label="Bonus Type"
                value={opportunity.type.replace('_', ' ').toUpperCase()}
                icon={AttachMoney}
              />
            )}
          </Grid>
          <Grid item xs={12} sm={6}>
            <DetailItem
              label="Requirements"
              value={opportunity.metadata.bonus.requirements.description}
              icon={CheckCircle}
            />
          </Grid>
          {opportunity.metadata.bonus.tiers &&
            opportunity.metadata.bonus.tiers.length > 0 && (
              <Grid item xs={12}>
                <Typography
                  variant="subtitle1"
                  sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}
                >
                  Bonus Tiers
                </Typography>
                <Grid container spacing={2}>
                  {opportunity.metadata.bonus.tiers.map((tier, index) => (
                    <Grid
                      item
                      xs={12}
                      key={index}
                      component={motion.div}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Box
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
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
                        <Box flex={1}>
                          <Typography variant="body2" color="text.secondary">
                            Requirement: {tier.requirement}
                          </Typography>
                          <Typography variant="body2" color="primary" fontWeight={600}>
                            Bonus: {tier.bonus}
                          </Typography>
                          {tier.details && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 0.5 }}
                            >
                              {tier.details}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            )}
        </Grid>
      </Paper>
    );
  };

  const getTypeSpecificDetails = () => {
    switch (opportunity.type) {
      case 'brokerage':
        return opportunity.metadata.features ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mb: 3,
              borderRadius: 3,
              bgcolor: isDark
                ? alpha(theme.palette.background.paper, 0.6)
                : 'background.paper',
              border: '1px solid',
              borderColor: isDark ? alpha(theme.palette.divider, 0.1) : 'divider',
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[4],
              },
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: 'primary.main',
                fontWeight: 600,
                mb: 3,
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
              <AccountBalanceWallet /> Brokerage Features
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <DetailItem
                  label="Features"
                  value={opportunity.metadata.features}
                  icon={Layers}
                />
              </Grid>
            </Grid>
          </Paper>
        ) : null;

      case 'bank_account':
        return opportunity.metadata.fees ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mb: 3,
              borderRadius: 3,
              bgcolor: isDark
                ? alpha(theme.palette.background.paper, 0.6)
                : 'background.paper',
              border: '1px solid',
              borderColor: isDark ? alpha(theme.palette.divider, 0.1) : 'divider',
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[4],
              },
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: 'primary.main',
                fontWeight: 600,
                mb: 3,
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
              <AccountBalance /> Account Features
            </Typography>
            <Grid container spacing={3}>
              {opportunity.metadata.fees.monthly && (
                <Grid item xs={12} sm={6}>
                  <DetailItem
                    label="Monthly Fee"
                    value={opportunity.metadata.fees.monthly}
                    icon={MonetizationOn}
                  />
                </Grid>
              )}
              {opportunity.metadata.fees.details && (
                <Grid item xs={12}>
                  <DetailItem
                    label="Fee Details"
                    value={opportunity.metadata.fees.details}
                    icon={Info}
                  />
                </Grid>
              )}
            </Grid>
          </Paper>
        ) : null;

      case 'credit_card':
        return opportunity.metadata.features ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mb: 3,
              borderRadius: 3,
              bgcolor: isDark
                ? alpha(theme.palette.background.paper, 0.6)
                : 'background.paper',
              border: '1px solid',
              borderColor: isDark ? alpha(theme.palette.divider, 0.1) : 'divider',
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[4],
              },
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: 'primary.main',
                fontWeight: 600,
                mb: 3,
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
              <CreditCard /> Card Features
            </Typography>
            <Grid container spacing={3}>
              {opportunity.metadata.features.length > 0 && (
                <Grid item xs={12}>
                  <DetailItem
                    label="Features"
                    value={opportunity.metadata.features}
                    icon={LocalOffer}
                  />
                </Grid>
              )}
              {opportunity.metadata.perks && (
                <Grid item xs={12}>
                  <DetailItem
                    label="Perks"
                    value={opportunity.metadata.perks}
                    icon={Stars}
                  />
                </Grid>
              )}
              {opportunity.metadata.fees?.annual && (
                <Grid item xs={12} sm={6}>
                  <DetailItem
                    label="Annual Fee"
                    value={opportunity.metadata.fees.annual}
                    icon={MonetizationOn}
                  />
                </Grid>
              )}
              {opportunity.metadata.credit?.chase_524_rule && (
                <Grid item xs={12}>
                  <Alert severity="warning" icon={<Warning />} sx={{ borderRadius: 2 }}>
                    <AlertTitle>Chase 5/24 Rule Applies</AlertTitle>
                    This card is subject to Chase&apos;s 5/24 rule.
                  </Alert>
                </Grid>
              )}
            </Grid>
          </Paper>
        ) : null;

      default:
        return null;
    }
  };

  const getCreditCheckText = (opportunity: FormData) => {
    const creditInquiry = opportunity.details?.credit_inquiry;
    if (!creditInquiry) return 'Unknown';
    return creditInquiry;
  };

  const renderAvailability = (opportunity: FormData) => {
    const availability = opportunity.details?.availability;
    if (!availability) return null;

    if (availability.type === 'Nationwide') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Public sx={{ fontSize: '1rem', color: 'primary.main' }} />
          <Typography variant="body2">Nationwide</Typography>
        </Box>
      );
    }

    if (availability.states && availability.states.length > 0) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LocationOn sx={{ fontSize: '1rem', color: 'primary.main' }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {availability.states.length}{' '}
              {availability.states.length === 1 ? 'state' : 'states'}
            </Typography>
          </Box>
          <StateDisplay states={availability.states} />
        </Box>
      );
    }

    return null;
  };

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: 4,
        animation: 'fadeIn 0.5s ease-out',
        '@keyframes fadeIn': {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Link href="/opportunities" style={{ textDecoration: 'none' }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            sx={{
              mb: 3,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                transform: 'translateX(-4px)',
              },
            }}
          >
            Back to Opportunities
          </Button>
        </Link>

        <Paper
          elevation={0}
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          sx={{
            p: 4,
            borderRadius: 3,
            bgcolor: isDark
              ? alpha(theme.palette.background.paper, 0.6)
              : 'background.paper',
            border: '1px solid',
            borderColor: isDark ? alpha(theme.palette.divider, 0.1) : 'divider',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(8px)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 4,
              left: 0,
              right: 0,
              bottom: 0,
              background: isDark
                ? 'radial-gradient(circle at top right, rgba(25, 118, 210, 0.05), transparent 70%)'
                : 'radial-gradient(circle at top right, rgba(25, 118, 210, 0.08), transparent 70%)',
              pointerEvents: 'none',
            },
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    p: 2,
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
                    <CreditCard sx={{ fontSize: '2.5rem', color: 'primary.main' }} />
                  ) : opportunity.type === 'brokerage' ? (
                    <AccountBalanceWallet
                      sx={{ fontSize: '2.5rem', color: 'primary.main' }}
                    />
                  ) : (
                    <AccountBalance sx={{ fontSize: '2.5rem', color: 'primary.main' }} />
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
                    {opportunity.name}
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      icon={
                        opportunity.type === 'credit_card' ? (
                          <CreditCard />
                        ) : opportunity.type === 'brokerage' ? (
                          <AccountBalanceWallet />
                        ) : (
                          <AccountBalance />
                        )
                      }
                      label={opportunity.type.replace('_', ' ').toUpperCase()}
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
                      icon={<MonetizationOn />}
                      label={`$${parseInt(opportunity.value).toLocaleString()}`}
                      color="success"
                      sx={{
                        fontWeight: 600,
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                        },
                      }}
                    />
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
                  gap: 2,
                }}
              >
                {opportunity.offer_link ? (
                  <Button
                    variant="contained"
                    size="large"
                    component={motion.a}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href={opportunity.offer_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 4,
                      py: 1.5,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                      boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
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
                        background: 'rgba(255, 255, 255, 0.3)',
                        transform: 'skewX(-15deg)',
                        transition: 'all 0.6s',
                        filter: 'blur(5px)',
                      },
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 12px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                        '&::before': {
                          left: '200%',
                        },
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      View Offer
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
                      >
                        →
                      </motion.div>
                    </Box>
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    disabled
                    size="large"
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 4,
                      py: 1.5,
                    }}
                  >
                    No Link Available
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Main Content */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {/* Bonus Details Section */}
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mb: 3,
              borderRadius: 3,
              bgcolor: isDark
                ? alpha(theme.palette.background.paper, 0.6)
                : 'background.paper',
              border: '1px solid',
              borderColor: isDark ? alpha(theme.palette.divider, 0.1) : 'divider',
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[4],
              },
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: 'primary.main',
                fontWeight: 600,
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
              <LocalOffer /> Bonus Details
            </Typography>
            <DetailItem
              label="Bonus Value"
              value={`$${parseInt(opportunity.value).toLocaleString()}`}
              icon={AttachMoney}
            />
            <DetailItem
              label="Bonus Description"
              value={opportunity.bonus.description}
              icon={Description}
            />
            <DetailItem
              label="Requirements"
              value={opportunity.bonus.requirements.description}
              icon={CheckCircle}
            />
            {opportunity.bonus.additional_info && (
              <DetailItem
                label="Additional Information"
                value={opportunity.bonus.additional_info}
                icon={Info}
              />
            )}
          </Paper>

          {/* Account Details Section */}
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mb: 3,
              borderRadius: 3,
              bgcolor: isDark
                ? alpha(theme.palette.background.paper, 0.6)
                : 'background.paper',
              border: '1px solid',
              borderColor: isDark ? alpha(theme.palette.divider, 0.1) : 'divider',
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[4],
              },
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: 'primary.main',
                fontWeight: 600,
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
              <Layers /> Account Details
            </Typography>
            <DetailItem
              label="Account Type"
              value={opportunity.details.account_type}
              icon={AccountBalance}
            />
            <DetailItem
              label="Monthly Fee"
              value={opportunity.details.monthly_fees.amount}
              icon={AttachMoney}
            />
            {opportunity.details.early_closure_fee && (
              <DetailItem
                label="Early Closure Fee"
                value={opportunity.details.early_closure_fee}
                icon={Warning}
              />
            )}
            {opportunity.details.household_limit && (
              <DetailItem
                label="Household Limit"
                value={opportunity.details.household_limit}
                icon={Info}
              />
            )}
            {opportunity.details.chex_systems && (
              <DetailItem
                label="ChexSystems"
                value={opportunity.details.chex_systems}
                icon={CreditScore}
              />
            )}
          </Paper>

          {/* Availability Section */}
          <Paper
            elevation={0}
            sx={{
              p: 4,
              mb: 3,
              borderRadius: 3,
              bgcolor: isDark
                ? alpha(theme.palette.background.paper, 0.6)
                : 'background.paper',
              border: '1px solid',
              borderColor: isDark ? alpha(theme.palette.divider, 0.1) : 'divider',
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[4],
              },
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: 'primary.main',
                fontWeight: 600,
                mb: 3,
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
              <LocationOn /> Availability
            </Typography>
            {renderAvailability(opportunity)}
          </Paper>

          {/* Credit Check Section */}
          {opportunity.details.credit_inquiry && (
            <Paper
              elevation={0}
              sx={{
                p: 4,
                mb: 3,
                borderRadius: 3,
                bgcolor: isDark
                  ? alpha(theme.palette.background.paper, 0.6)
                  : 'background.paper',
                border: '1px solid',
                borderColor: isDark ? alpha(theme.palette.divider, 0.1) : 'divider',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: 'primary.main',
                  fontWeight: 600,
                  mb: 3,
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
                <CreditScore /> Credit Check
              </Typography>
              <DetailItem
                label="Credit Inquiry"
                value={getCreditCheckText(opportunity)}
                icon={CreditScore}
              />
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Floating Action Button */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 1000,
        }}
      >
        {opportunity.offer_link ? (
          <Button
            variant="contained"
            size="large"
            component="a"
            href={opportunity.offer_link}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              borderRadius: 30,
              textTransform: 'none',
              fontWeight: 600,
              px: 4,
              py: 1.5,
              boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 12px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
              },
            }}
          >
            View Offer
          </Button>
        ) : null}
      </Box>
    </Container>
  );
}

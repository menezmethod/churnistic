'use client';

import {
  AccountBalance as AccountBalanceIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  CalendarToday as CalendarTodayIcon,
  CheckCircle as CheckCircleIcon,
  CreditCard as CreditCardIcon,
  CreditScore as CreditScoreIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  LocationOn as LocationOnIcon,
  MonetizationOn as MonetizationOnIcon,
  Payments as PaymentsIcon,
  Public as PublicIcon,
  ArrowForward as ArrowForwardIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  SxProps,
  Theme,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { Permission } from '@/lib/auth/types';
import { FirestoreOpportunity } from '@/types/opportunity';

import { LogoImage } from './LogoImage';
import { getTypeColors } from '../utils/colorUtils';

interface OpportunityCardProps {
  opportunity: FirestoreOpportunity;
  isDeleting: boolean;
  onDeleteClick: (opportunity: FirestoreOpportunity) => void;
  onFeatureClick?: (opportunity: FirestoreOpportunity) => Promise<void>;
  viewMode?: 'grid' | 'list';
  index?: number;
  sx?: SxProps<Theme>;
}

export default function OpportunityCard({
  opportunity,
  isDeleting,
  onDeleteClick,
  onFeatureClick,
  index = 0,
  sx,
}: OpportunityCardProps) {
  const theme = useTheme();
  const { user, hasPermission } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [isFeatureLoading, setIsFeatureLoading] = useState(false);
  const isDark = theme.palette.mode === 'dark';
  const canModify = hasPermission(Permission.FEATURE_OPPORTUNITIES);
  const isFeatured = opportunity.metadata?.featured;
  const colors = getTypeColors(opportunity.type, theme);
  const router = useRouter();

  const handleDeleteClick = () => {
    if (!user) {
      router.push('/auth/signin?redirect=/opportunities');
      return;
    }
    onDeleteClick(opportunity);
  };

  const handleFeatureClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!canModify || !onFeatureClick) return;

    setIsFeatureLoading(true);
    try {
      await onFeatureClick(opportunity);
    } catch (error) {
      console.error('Failed to toggle feature status:', error);
    } finally {
      setIsFeatureLoading(false);
    }
  };

  const displayValue = (value: string | number) => {
    if (typeof value === 'number') return formatCurrency(value);
    const numericValue = parseFloat(value.replace(/[$,]/g, ''));
    return isNaN(numericValue) ? '$0' : formatCurrency(numericValue);
  };

  const getTypeIcon = () => {
    switch (opportunity.type) {
      case 'credit_card':
        return <CreditCardIcon />;
      case 'bank':
        return <AccountBalanceIcon />;
      case 'brokerage':
        return <AccountBalanceWalletIcon />;
      default:
        return <MonetizationOnIcon />;
    }
  };

  const renderRequirements = () => {
    if (!opportunity.bonus?.requirements?.[0]?.description) return null;
    const requirements = opportunity.bonus.requirements[0].description.split('\n');

    return (
      <Stack spacing={1}>
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.info.main,
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          HOW TO QUALIFY
        </Typography>
        <Stack spacing={0.5}>
          {requirements.map((req, idx) => (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon
                sx={{ fontSize: '0.9rem', color: theme.palette.success.main }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: 'text.primary',
                  fontSize: '0.875rem',
                  lineHeight: 1.4,
                }}
              >
                {req}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Stack>
    );
  };

  const renderFeatures = () => {
    const features = [];

    if (opportunity.type === 'credit_card') {
      if (opportunity.details?.annual_fees) {
        features.push({
          icon: MonetizationOnIcon,
          label: `Annual Fee: ${opportunity.details.annual_fees.amount}${
            opportunity.details.annual_fees.waived_first_year
              ? ' (First Year Waived)'
              : ''
          }`,
          color: theme.palette.warning.main,
        });
      }
      if (opportunity.details?.credit_inquiry) {
        features.push({
          icon: CreditScoreIcon,
          label: opportunity.details.credit_inquiry,
          color: theme.palette.info.main,
        });
      }
    } else {
      if (opportunity.details?.monthly_fees) {
        features.push({
          icon: PaymentsIcon,
          label: `Monthly Fee: ${opportunity.details.monthly_fees.amount}`,
          color: theme.palette.warning.main,
        });
      }
      if (opportunity.details?.account_type) {
        features.push({
          icon: AccountBalanceIcon,
          label: opportunity.details.account_type,
          color: theme.palette.info.main,
        });
      }
    }

    if (features.length === 0) return null;

    return (
      <Stack spacing={1}>
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.warning.main,
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          FEATURES
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {features.map((feature, idx) => (
            <Chip
              key={idx}
              icon={<feature.icon sx={{ fontSize: '1rem' }} />}
              label={feature.label}
              size="small"
              sx={{
                bgcolor: alpha(feature.color, 0.1),
                color: feature.color,
                '& .MuiChip-icon': {
                  color: feature.color,
                },
                borderRadius: '6px',
              }}
            />
          ))}
        </Stack>
      </Stack>
    );
  };

  const renderAvailability = () => {
    if (!opportunity.details?.availability) return null;

    const isNationwide = opportunity.details.availability.type === 'Nationwide';
    const states = opportunity.details.availability.states || [];
    const uniqueStates = Array.from(new Set(states));

    return (
      <Stack spacing={1}>
        <Typography
          variant="caption"
          sx={{
            color: theme.palette.primary.main,
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          AVAILABILITY
        </Typography>
        <Stack spacing={1}>
          <Chip
            icon={isNationwide ? <PublicIcon /> : <LocationOnIcon />}
            label={
              isNationwide ? 'Nationwide' : `${uniqueStates.length} States Available`
            }
            size="small"
            sx={{
              bgcolor: alpha(colors.primary, 0.1),
              color: colors.primary,
              '& .MuiChip-icon': {
                color: colors.primary,
              },
              borderRadius: '6px',
              alignSelf: 'flex-start',
            }}
          />
          {!isNationwide && uniqueStates.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {uniqueStates.map((state) => (
                <Chip
                  key={state}
                  label={state}
                  size="small"
                  sx={{
                    bgcolor: alpha(colors.primary, 0.05),
                    color: 'text.secondary',
                    borderRadius: '6px',
                  }}
                />
              ))}
            </Box>
          )}
        </Stack>
      </Stack>
    );
  };

  // Get detailed information for tooltip
  const getDetailedInfo = () => {
    const details = [];

    // Add bonus value and requirements
    if (opportunity.bonus?.requirements?.[0]?.description) {
      details.push({
        title: 'Bonus Details',
        content: `${displayValue(opportunity.value)} - ${opportunity.bonus.requirements[0].description}`,
      });
    }

    // Add expiration date if available
    if (opportunity.details?.expiration) {
      details.push({
        title: 'Offer Expiration',
        content: opportunity.details.expiration,
        icon: <CalendarTodayIcon sx={{ fontSize: '0.9rem' }} />,
      });
    }

    // Add credit inquiry if available (for credit cards)
    if (opportunity.type === 'credit_card' && opportunity.details?.credit_inquiry) {
      details.push({
        title: 'Credit Pull',
        content: opportunity.details.credit_inquiry,
        icon: <CreditScoreIcon sx={{ fontSize: '0.9rem' }} />,
      });
    }

    // Add account type details if available
    if (opportunity.details?.account_type) {
      details.push({
        title: 'Account Type',
        content: opportunity.details.account_type,
        icon: <AccountBalanceIcon sx={{ fontSize: '0.9rem' }} />,
      });
    }

    // Add monthly fees if available
    if (opportunity.details?.monthly_fees) {
      details.push({
        title: 'Monthly Fee',
        content: opportunity.details.monthly_fees.amount,
        icon: <PaymentsIcon sx={{ fontSize: '0.9rem' }} />,
      });
    }

    // Add annual fees if available (for credit cards)
    if (opportunity.type === 'credit_card' && opportunity.details?.annual_fees) {
      const waived = opportunity.details.annual_fees.waived_first_year
        ? ' (First Year Waived)'
        : '';
      details.push({
        title: 'Annual Fee',
        content: `${opportunity.details.annual_fees.amount}${waived}`,
        icon: <MonetizationOnIcon sx={{ fontSize: '0.9rem' }} />,
      });
    }

    return details;
  };

  return (
    <Paper
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      elevation={0}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isDark ? alpha(theme.palette.background.paper, 0.6) : 'background.paper',
        border: '1px solid',
        borderColor: isFeatured ? alpha(theme.palette.warning.main, 0.2) : 'divider',
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(8px)',
        ...(isFeatured && {
          boxShadow: `0 8px 16px ${alpha(theme.palette.warning.main, 0.15)}`,
        }),
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: isFeatured
            ? `0 12px 24px ${alpha(theme.palette.warning.main, 0.25)}`
            : `0 12px 24px ${alpha(theme.palette.common.black, 0.12)}`,
          '& .delete-button': {
            opacity: 1,
          },
        },
        ...sx,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(135deg, ${alpha(colors.primary, 0.2)}, ${alpha(
              colors.dark,
              0.1
            )})`,
            transition: 'transform 0.3s ease',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          <LogoImage logo={opportunity.logo} name={opportunity.name} colors={colors} />
        </Box>
        <Box flex={1}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              fontSize: '1rem',
              lineHeight: 1.2,
            }}
          >
            {opportunity.name}
          </Typography>
          <Chip
            icon={getTypeIcon()}
            label={opportunity.type.replace('_', ' ').toUpperCase()}
            size="small"
            sx={{
              mt: 0.5,
              bgcolor: colors.alpha,
              color: colors.primary,
              '& .MuiChip-icon': {
                color: colors.primary,
              },
              borderRadius: '6px',
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {isFeatured && !canModify && (
            <Tooltip
              title="Featured Offer"
              placement="top"
              componentsProps={{
                tooltip: {
                  sx: {
                    bgcolor: alpha(theme.palette.warning.main, 0.9),
                    '& .MuiTooltip-arrow': {
                      color: alpha(theme.palette.warning.main, 0.9),
                    },
                  },
                },
              }}
            >
              <StarIcon
                sx={{
                  color: theme.palette.warning.main,
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'scale(1.1)',
                  },
                }}
              />
            </Tooltip>
          )}
          {canModify && (
            <>
              <Tooltip title={`${isFeatured ? 'Unfeature' : 'Feature'} opportunity`}>
                <IconButton
                  onClick={handleFeatureClick}
                  disabled={isFeatureLoading}
                  sx={{
                    color: isFeatured ? 'warning.main' : 'text.secondary',
                    '&:hover': {
                      bgcolor: alpha(
                        isFeatured
                          ? theme.palette.warning.main
                          : theme.palette.primary.main,
                        0.1
                      ),
                    },
                  }}
                >
                  {isFeatureLoading ? (
                    <CircularProgress
                      size={20}
                      color={isFeatured ? 'warning' : 'primary'}
                    />
                  ) : isFeatured ? (
                    <StarIcon />
                  ) : (
                    <StarBorderIcon />
                  )}
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete opportunity">
                <IconButton
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  sx={{
                    transition: 'opacity 0.2s ease-in-out',
                    color: theme.palette.error.main,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                    },
                  }}
                >
                  {isDeleting ? (
                    <CircularProgress size={20} color="error" />
                  ) : (
                    <DeleteIcon />
                  )}
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Bonus Value */}
        <Box sx={{ mb: 2.5 }}>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.success.main,
              fontWeight: 600,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'block',
              mb: 0.5,
            }}
          >
            BONUS VALUE
          </Typography>
          <Typography
            variant="h4"
            sx={{
              color: theme.palette.success.main,
              fontWeight: 700,
              fontSize: '2rem',
            }}
          >
            {displayValue(opportunity.value)}
          </Typography>
        </Box>

        {/* Main card content in a more organized grid layout */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: 2.5,
            mb: 2.5,
          }}
        >
          {/* Requirements */}
          {renderRequirements() && <Box>{renderRequirements()}</Box>}

          {/* Features */}
          {renderFeatures() && <Box>{renderFeatures()}</Box>}

          {/* Availability */}
          {renderAvailability() && <Box>{renderAvailability()}</Box>}
        </Box>

        {/* Actions */}
        <Box
          sx={{ mt: 'auto', display: 'grid', gridTemplateColumns: '1fr auto', gap: 1 }}
        >
          <Link
            href={`/opportunities/${opportunity.id}`}
            style={{ textDecoration: 'none' }}
          >
            <Button
              fullWidth
              variant="contained"
              sx={{
                py: 1.25,
                background: `linear-gradient(45deg, ${colors.primary}, ${colors.dark})`,
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: isHovered
                  ? `0 8px 16px ${alpha(colors.primary, 0.25)}`
                  : 'none',
                '&:hover': {
                  background: `linear-gradient(45deg, ${colors.dark}, ${colors.primary})`,
                  filter: 'brightness(1.1)',
                },
              }}
            >
              View Details
              <ArrowForwardIcon sx={{ ml: 1, fontSize: '0.9rem' }} />
            </Button>
          </Link>

          {/* Enhanced Info Button with more comprehensive tooltip */}
          <Tooltip
            title={
              <Box sx={{ p: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  {opportunity.name} Details
                </Typography>

                {getDetailedInfo().map((detail, idx) => (
                  <Stack
                    key={idx}
                    direction="row"
                    spacing={1}
                    alignItems="flex-start"
                    sx={{
                      mb: 1,
                      pb: idx < getDetailedInfo().length - 1 ? 1 : 0,
                      borderBottom:
                        idx < getDetailedInfo().length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                    }}
                  >
                    {detail.icon && (
                      <Box sx={{ color: colors.primary, mt: 0.3 }}>{detail.icon}</Box>
                    )}
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 600, color: colors.primary }}
                      >
                        {detail.title}
                      </Typography>
                      <Typography variant="body2">{detail.content}</Typography>
                    </Box>
                  </Stack>
                ))}

                {opportunity.offer_link && (
                  <Button
                    variant="outlined"
                    href={opportunity.offer_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    fullWidth
                    sx={{
                      mt: 1,
                      borderRadius: '8px',
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      color: colors.primary,
                      borderColor: colors.primary,
                    }}
                  >
                    View on Provider Website
                  </Button>
                )}
              </Box>
            }
            arrow
            placement="top-end"
            componentsProps={{
              tooltip: {
                sx: {
                  maxWidth: 320,
                  bgcolor: theme.palette.background.paper,
                  boxShadow: `0 8px 16px ${alpha(theme.palette.common.black, 0.15)}`,
                  color: 'text.primary',
                  p: 2,
                  borderRadius: '10px',
                  '& .MuiTooltip-arrow': {
                    color: theme.palette.background.paper,
                  },
                },
              },
            }}
          >
            <Button
              variant="outlined"
              sx={{
                minWidth: 'unset',
                width: 42,
                height: 42,
                borderRadius: '8px',
                borderColor: 'divider',
                color: colors.primary,
                '&:hover': {
                  borderColor: colors.primary,
                  bgcolor: alpha(colors.primary, 0.04),
                },
              }}
            >
              <InfoIcon sx={{ fontSize: '1.1rem' }} />
            </Button>
          </Tooltip>
        </Box>
      </Box>
    </Paper>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

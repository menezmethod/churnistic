'use client';

import {
  AccountBalance,
  ArrowForward,
  Delete,
  LocationOn,
  Public,
  Schedule,
  Timer,
  Verified,
  Warning,
} from '@mui/icons-material';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  Typography,
  Avatar,
  IconButton,
  alpha,
  useTheme,
  Chip,
  Button,
  Tooltip,
  Paper,
} from '@mui/material';
import { motion } from 'framer-motion';
import Link from 'next/link';

import { FirestoreOpportunity } from '@/types/opportunity';

import { getTypeColors } from '../utils/colorUtils';

interface OpportunityListProps {
  opportunities: FirestoreOpportunity[];
  isDeleting: string | null;
  onDeleteClick: (opportunity: FirestoreOpportunity) => void;
}

const OpportunityList = ({
  opportunities,
  isDeleting,
  onDeleteClick,
}: OpportunityListProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const formatRequirements = (opportunity: FirestoreOpportunity) => {
    // Check bonus requirements first as they are more detailed
    if (opportunity.bonus?.requirements?.description) {
      return opportunity.bonus.requirements.description;
    }

    // Then check direct requirements
    if (opportunity.requirements?.length) {
      return opportunity.requirements[0];
    }

    // Check spending requirement if available
    if (opportunity.bonus?.requirements?.spending_requirement) {
      const { amount, timeframe } = opportunity.bonus.requirements.spending_requirement;
      return `Spend $${amount.toLocaleString()} within ${timeframe}`;
    }

    // Check minimum deposit if available
    if (opportunity.bonus?.requirements?.minimum_deposit) {
      return `Minimum deposit of $${opportunity.bonus.requirements.minimum_deposit.toLocaleString()}`;
    }

    return 'No specific requirements';
  };

  const getStatusChip = (opportunity: FirestoreOpportunity) => {
    const isExpiringSoon =
      opportunity.expirationDate &&
      new Date(opportunity.expirationDate).getTime() - new Date().getTime() <
        7 * 24 * 60 * 60 * 1000;

    if (isExpiringSoon) {
      return (
        <Chip
          size="small"
          icon={<Timer sx={{ fontSize: '1rem !important' }} />}
          label="Expiring Soon"
          sx={{
            bgcolor: alpha(theme.palette.warning.main, 0.1),
            color: theme.palette.warning.main,
            '& .MuiChip-icon': { color: theme.palette.warning.main },
          }}
        />
      );
    }

    if (opportunity.isNew) {
      return (
        <Chip
          size="small"
          icon={<Verified sx={{ fontSize: '1rem !important' }} />}
          label="New"
          sx={{
            bgcolor: alpha(theme.palette.success.main, 0.1),
            color: theme.palette.success.main,
            '& .MuiChip-icon': { color: theme.palette.success.main },
          }}
        />
      );
    }

    return null;
  };

  return (
    <List sx={{ width: '100%', p: 0 }}>
      {opportunities.map((opportunity, index) => {
        const colors = getTypeColors(opportunity.type, theme);
        const isLast = index === opportunities.length - 1;

        return (
          <Paper
            key={opportunity.id}
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            elevation={1}
            sx={{
              mb: isLast ? 0 : 2,
              borderRadius: 3,
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              bgcolor: isDark
                ? alpha(theme.palette.background.paper, 0.6)
                : alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(10px)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 12px 24px ${alpha(theme.palette.common.black, 0.12)}`,
                '& .opportunity-actions': {
                  opacity: 1,
                  transform: 'translateX(0)',
                },
              },
            }}
          >
            <ListItem
              disableGutters
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: { xs: 2, sm: 0 },
              }}
            >
              {/* Left Section - Avatar and Main Info */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: alpha(colors.primary, 0.15),
                      color: colors.primary,
                      boxShadow: `0 0 0 1px ${alpha(colors.primary, 0.1)}`,
                    }}
                  >
                    {colors.icon}
                  </Avatar>
                </ListItemAvatar>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {opportunity.name}
                    </Typography>
                    {getStatusChip(opportunity)}
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      color: 'text.secondary',
                      mb: 1,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccountBalance sx={{ fontSize: '1rem' }} />
                      <Typography variant="body2">
                        {opportunity.type
                          .split('_')
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ')}
                      </Typography>
                    </Box>
                    {opportunity.bank && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Verified sx={{ fontSize: '1rem' }} />
                        <Typography variant="body2">{opportunity.bank}</Typography>
                      </Box>
                    )}
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      maxWidth: '600px',
                    }}
                  >
                    {formatRequirements(opportunity)}
                  </Typography>
                </Box>
              </Box>

              {/* Right Section - Value and Actions */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'row', sm: 'column' },
                  alignItems: { xs: 'center', sm: 'flex-end' },
                  gap: 2,
                  ml: { xs: 0, sm: 2 },
                  width: { xs: '100%', sm: 'auto' },
                }}
              >
                <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.success.main,
                      mb: 0.5,
                      textShadow: `0 0 20px ${alpha(theme.palette.success.main, 0.3)}`,
                    }}
                  >
                    {opportunity.value.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    })}
                  </Typography>
                  {opportunity.metadata?.timing?.bonus_posting_time && (
                    <Tooltip title="Estimated time to receive bonus" arrow>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          justifyContent: 'flex-end',
                        }}
                      >
                        <Schedule sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {opportunity.metadata.timing.bonus_posting_time}
                        </Typography>
                      </Box>
                    </Tooltip>
                  )}
                </Box>
                <Box
                  className="opportunity-actions"
                  sx={{
                    display: 'flex',
                    gap: 1,
                    alignItems: 'center',
                    justifyContent: { xs: 'flex-end', sm: 'flex-end' },
                    width: { xs: '100%', sm: 'auto' },
                    opacity: { xs: 1, sm: 0.8 },
                    transform: { xs: 'none', sm: 'translateX(10px)' },
                    transition: 'all 0.3s ease-in-out',
                  }}
                >
                  <Link
                    href={`/opportunities/${opportunity.id}`}
                    passHref
                    style={{ textDecoration: 'none' }}
                  >
                    <Button
                      variant="contained"
                      endIcon={<ArrowForward />}
                      sx={{
                        px: 2,
                        py: 1,
                        background: `linear-gradient(45deg, ${colors.primary}, ${alpha(colors.primary, 0.8)})`,
                        textTransform: 'none',
                        borderRadius: '12px',
                        boxShadow: `0 4px 12px ${alpha(colors.primary, 0.3)}`,
                        '&:hover': {
                          background: `linear-gradient(45deg, ${colors.primary}, ${alpha(colors.primary, 0.9)})`,
                          boxShadow: `0 6px 16px ${alpha(colors.primary, 0.4)}`,
                        },
                      }}
                    >
                      View Details
                    </Button>
                  </Link>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => onDeleteClick(opportunity)}
                    disabled={isDeleting === opportunity.id}
                    sx={{
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                      backdropFilter: 'blur(4px)',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.error.main, 0.2),
                      },
                    }}
                  >
                    <Delete
                      sx={{
                        color:
                          isDeleting === opportunity.id
                            ? alpha(theme.palette.error.main, 0.5)
                            : theme.palette.error.main,
                      }}
                    />
                  </IconButton>
                </Box>
              </Box>
            </ListItem>

            {/* Footer Section - Additional Details */}
            <Box
              sx={{
                px: 3,
                pb: 2,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              {opportunity.metadata?.availability?.is_nationwide ? (
                <Tooltip title="Available Nationwide" arrow>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Public sx={{ fontSize: '1rem', color: 'primary.main' }} />
                    <Typography variant="body2" color="text.secondary">
                      Available Nationwide
                    </Typography>
                  </Box>
                </Tooltip>
              ) : opportunity.metadata?.availability?.regions ? (
                <Tooltip
                  title={opportunity.metadata.availability.regions.join(', ')}
                  arrow
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOn sx={{ fontSize: '1rem', color: 'primary.main' }} />
                    <Typography variant="body2" color="text.secondary">
                      {opportunity.metadata.availability.regions.length} States Available
                    </Typography>
                  </Box>
                </Tooltip>
              ) : null}

              {opportunity.metadata?.credit?.inquiry && (
                <Tooltip title="Credit Check Type" arrow>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Warning
                      sx={{
                        fontSize: '1rem',
                        color:
                          opportunity.metadata.credit.inquiry === 'soft_pull'
                            ? 'success.main'
                            : 'warning.main',
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {opportunity.metadata.credit.inquiry === 'soft_pull'
                        ? 'Soft Pull'
                        : 'Hard Pull'}
                    </Typography>
                  </Box>
                </Tooltip>
              )}

              {opportunity.expirationDate && (
                <Tooltip title="Offer Expiration Date" arrow>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Timer
                      sx={{
                        fontSize: '1rem',
                        color:
                          new Date(opportunity.expirationDate).getTime() -
                            new Date().getTime() <
                          7 * 24 * 60 * 60 * 1000
                            ? 'warning.main'
                            : 'text.secondary',
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Expires: {new Date(opportunity.expirationDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Tooltip>
              )}
            </Box>
          </Paper>
        );
      })}
    </List>
  );
};

export default OpportunityList;

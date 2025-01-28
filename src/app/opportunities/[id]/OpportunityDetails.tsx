'use client';

import { Link as LinkIcon, ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
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

import { formatCurrency } from '@/lib/utils/formatters';

interface OpportunityDetailsProps {
  opportunity: {
    id: string;
    name: string;
    type: 'credit_card' | 'bank' | 'brokerage';
    value: number;
    bank: string;
    status: string;
    source: {
      name: string;
      collected_at: string;
    };
    source_id: string;
    bonus: {
      title: string;
      value: number;
      description: string;
      requirements: Array<{
        type: string;
        details: {
          amount: number;
          period: number;
        };
      }>;
      tiers?: Array<{
        reward: string;
        deposit: string;
      }> | null;
    };
    details: {
      monthly_fees?: {
        amount: string;
      } | null;
      annual_fees?: string | null;
      account_type?: string | null;
      availability?: {
        type: string;
        states: string[];
      } | null;
      credit_inquiry?: string | null;
      expiration?: string | null;
    };
    logo?: {
      type: string;
      url: string;
    };
    card_image?: {
      url: string;
      network?: string;
      color?: string;
      badge?: string;
    } | null;
    processing_status: {
      source_validation: boolean;
      ai_processed: boolean;
      duplicate_checked: boolean;
      needs_review: boolean;
    };
    ai_insights: {
      confidence_score: number;
      validation_warnings: string[];
      potential_duplicates: string[];
    };
    createdAt: string;
    updatedAt: string;
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

export default function OpportunityDetails({ opportunity }: OpportunityDetailsProps) {
  const theme = useTheme();

  const formatRequirement = (req: {
    type: string;
    details: { amount: number; period: number };
  }) => {
    switch (req.type) {
      case 'spending':
        return `Spend $${req.details.amount} within ${req.details.period} days`;
      default:
        return `$${req.details.amount} requirement`;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box>
        {/* Header Section */}
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
              <Typography variant="h4" fontWeight="bold">
                {opportunity.name}
              </Typography>
              <Chip
                label={opportunity.type}
                color={
                  opportunity.type === 'credit_card'
                    ? 'primary'
                    : opportunity.type === 'bank'
                      ? 'success'
                      : 'info'
                }
              />
            </Box>
            <ValueDisplay value={opportunity.value} />
          </Box>
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
          <Typography variant="h6" gutterBottom>
            Description
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {opportunity.bonus.description}
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
          <Typography variant="h6" gutterBottom>
            Requirements
          </Typography>

          {opportunity.bonus.requirements.map((req, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Typography variant="body1">{formatRequirement(req)}</Typography>
            </Box>
          ))}

          {opportunity.bonus.tiers && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Bonus Tiers
              </Typography>
              <Grid container spacing={2}>
                {opportunity.bonus.tiers.map((tier, index) => (
                  <Grid item xs={12} sm={4} key={index}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="bold">
                        {tier.reward}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Deposit: {tier.deposit}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </Paper>

        {/* Source and Links Section */}
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
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                component="a"
                href={`/api/opportunities/${opportunity.id}/redirect`}
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

        {/* Additional Details Section */}
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
          <Typography variant="h6" gutterBottom>
            Additional Details
          </Typography>

          <Grid container spacing={3}>
            {opportunity.details.account_type && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Account Type
                </Typography>
                <Chip label={opportunity.details.account_type} />
              </Grid>
            )}

            {opportunity.details.credit_inquiry && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Credit Inquiry
                </Typography>
                <Chip
                  label={opportunity.details.credit_inquiry}
                  color={
                    opportunity.details.credit_inquiry.toLowerCase().includes('hard')
                      ? 'warning'
                      : 'success'
                  }
                />
              </Grid>
            )}

            {opportunity.details.annual_fees && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Annual Fees
                </Typography>
                <Chip
                  label={opportunity.details.annual_fees}
                  color={
                    opportunity.details.annual_fees.toLowerCase().includes('no')
                      ? 'success'
                      : 'warning'
                  }
                />
              </Grid>
            )}

            {opportunity.details.monthly_fees && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Monthly Fees
                </Typography>
                <Chip
                  label={opportunity.details.monthly_fees.amount}
                  color={
                    opportunity.details.monthly_fees.amount.toLowerCase().includes('none')
                      ? 'success'
                      : 'warning'
                  }
                />
              </Grid>
            )}

            {opportunity.details.expiration && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Expiration
                </Typography>
                <Chip label={opportunity.details.expiration} />
              </Grid>
            )}
          </Grid>
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

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

import CardBadgeSection from './CardBadgeSection';

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
        minimum_deposit?: number | null;
      }>;
      tiers?: Array<{
        reward: string;
        deposit: string;
        level?: string | null;
        value?: number | null;
        minimum_deposit?: number | null;
        requirements?: string | null;
      }> | null;
      additional_info?: string | null;
    };
    details: {
      monthly_fees?: {
        amount: string;
        waiver_details?: string | null;
      } | null;
      annual_fees?: {
        amount: string;
        waived_first_year: boolean;
      } | null;
      account_type?: string | null;
      account_category?: string | null;
      availability?: {
        type: string;
        states: string[];
        is_nationwide?: boolean;
      } | null;
      credit_inquiry?: string | null;
      expiration?: string | null;
      credit_score?: string | null;
      under_5_24?: {
        required: boolean;
        details: string;
      } | null;
      foreign_transaction_fees?: {
        percentage: string;
        waived: boolean;
      } | null;
      minimum_credit_limit?: string | null;
      rewards_structure?: {
        base_rewards?: string;
        bonus_categories?: Array<{
          category: string;
          rate: string;
        }>;
        welcome_bonus?: string;
      } | null;
      household_limit?: string | null;
      early_closure_fee?: string | null;
      chex_systems?: string | null;
      options_trading?: string | null;
      ira_accounts?: string | null;
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

  return (
    <Chip
      label={formatCurrency(value)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        fontWeight: 700,
        fontSize: '1.1rem',
        background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
        color: 'white',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered
          ? `0 4px 20px ${alpha(theme.palette.success.main, 0.4)}`
          : 'none',
      }}
    />
  );
};

export default function OpportunityDetails({ opportunity }: OpportunityDetailsProps) {
  const theme = useTheme();

  const formatRequirement = (req: {
    type: string;
    details: { amount: number; period: number };
    minimum_deposit?: number | null;
  }) => {
    let requirement = '';

    switch (req.type) {
      case 'spending':
        requirement = `Spend $${req.details.amount} within ${req.details.period} days`;
        break;
      default:
        requirement = `$${req.details.amount} requirement`;
    }

    if (req.minimum_deposit) {
      requirement += ` with minimum deposit of $${req.minimum_deposit}`;
    }

    return requirement;
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
            borderRadius: 3,
            background: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: alpha(theme.palette.divider, 0.1),
          }}
        >
          <Grid container spacing={4} alignItems="center">
            {/* Left side: Logo and details */}
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                {opportunity.logo && (
                  <Box
                    component="img"
                    src={opportunity.logo.url}
                    alt={opportunity.name}
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      objectFit: 'contain',
                      background: 'white',
                      p: 1,
                    }}
                  />
                )}
                <Box>
                  <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {opportunity.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={opportunity.type}
                      size="small"
                      color={
                        opportunity.type === 'credit_card'
                          ? 'primary'
                          : opportunity.type === 'bank'
                            ? 'success'
                            : 'info'
                      }
                      sx={{ textTransform: 'uppercase' }}
                    />
                    <ValueDisplay value={opportunity.value} />
                  </Box>
                </Box>
              </Box>

              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {opportunity.bonus.description}
              </Typography>

              <Box sx={{ display: 'flex', gap: 2 }}>
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
                    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                    },
                  }}
                >
                  View Offer
                </Button>
              </Box>
            </Grid>

            {/* Right side: Card image */}
            <Grid item xs={12} md={6}>
              {opportunity.card_image ? (
                <Box
                  component={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: 300,
                    borderRadius: 4,
                    overflow: 'hidden',
                    boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.3)}`,
                  }}
                >
                  <CardBadgeSection badge={opportunity.card_image.badge} />
                  <Box
                    component="img"
                    src={opportunity.card_image.url}
                    alt={opportunity.name}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: 'scale(1.1)',
                      transition: 'transform 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.15)',
                      },
                    }}
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: 300,
                    borderRadius: 4,
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.primary.main,
                      0.1
                    )}, ${alpha(theme.palette.primary.dark, 0.2)})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No card image available
                  </Typography>
                </Box>
              )}
            </Grid>
          </Grid>
        </Paper>

        {/* Requirements Section */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 3,
            borderRadius: 3,
            background: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(10px)',
            border: '1px solid',
            borderColor: alpha(theme.palette.divider, 0.1),
          }}
        >
          <Typography variant="h6" gutterBottom>
            Requirements
          </Typography>

          {opportunity.bonus.requirements.map((req, index) => (
            <Box
              key={index}
              sx={{
                mb: 2,
                p: 2,
                borderRadius: 2,
                background: alpha(theme.palette.background.paper, 0.5),
                border: '1px solid',
                borderColor: alpha(theme.palette.divider, 0.1),
              }}
            >
              <Typography variant="body1">{formatRequirement(req)}</Typography>
            </Box>
          ))}
        </Paper>

        {/* Additional Details Section with Enhanced Fields */}
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
            {opportunity.details?.account_type && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Account Type
                </Typography>
                <Chip label={opportunity.details.account_type} />
              </Grid>
            )}

            {opportunity.details?.credit_inquiry && (
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

            {opportunity.details?.credit_score && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Required Credit Score
                </Typography>
                <Chip label={opportunity.details.credit_score} />
              </Grid>
            )}

            {opportunity.details?.under_5_24 && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Chase 5/24 Rule
                </Typography>
                <Box>
                  <Chip
                    label={
                      opportunity.details.under_5_24.required
                        ? 'Required'
                        : 'Not Required'
                    }
                    color={
                      opportunity.details.under_5_24.required ? 'warning' : 'success'
                    }
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {opportunity.details.under_5_24.details}
                  </Typography>
                </Box>
              </Grid>
            )}

            {opportunity.details?.annual_fees && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Annual Fees
                </Typography>
                <Box>
                  <Chip
                    label={opportunity.details.annual_fees.amount}
                    color={
                      opportunity.details.annual_fees.amount === '0' ||
                      opportunity.details.annual_fees.amount.toLowerCase().includes('no')
                        ? 'success'
                        : 'warning'
                    }
                  />
                  {opportunity.details.annual_fees.waived_first_year && (
                    <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                      Waived first year
                    </Typography>
                  )}
                </Box>
              </Grid>
            )}

            {opportunity.details?.monthly_fees && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Monthly Fees
                </Typography>
                <Box>
                  <Chip
                    label={opportunity.details.monthly_fees.amount}
                    color={
                      opportunity.details.monthly_fees.amount
                        .toLowerCase()
                        .includes('none') ||
                      opportunity.details.monthly_fees.amount === '0'
                        ? 'success'
                        : 'warning'
                    }
                  />
                  {opportunity.details.monthly_fees.waiver_details && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {opportunity.details.monthly_fees.waiver_details}
                    </Typography>
                  )}
                </Box>
              </Grid>
            )}

            {opportunity.details?.foreign_transaction_fees && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Foreign Transaction Fees
                </Typography>
                <Box>
                  <Chip
                    label={`${opportunity.details.foreign_transaction_fees.percentage}${
                      opportunity.details.foreign_transaction_fees.waived
                        ? ' (Waived)'
                        : ''
                    }`}
                    color={
                      opportunity.details.foreign_transaction_fees.waived
                        ? 'success'
                        : 'warning'
                    }
                  />
                </Box>
              </Grid>
            )}

            {opportunity.details?.minimum_credit_limit && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Minimum Credit Limit
                </Typography>
                <Chip label={opportunity.details.minimum_credit_limit} />
              </Grid>
            )}

            {opportunity.details?.household_limit && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Household Limit
                </Typography>
                <Chip label={opportunity.details.household_limit} />
              </Grid>
            )}

            {opportunity.details?.early_closure_fee && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Early Closure Fee
                </Typography>
                <Chip label={opportunity.details.early_closure_fee} />
              </Grid>
            )}

            {opportunity.details?.chex_systems && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  ChexSystems
                </Typography>
                <Chip label={opportunity.details.chex_systems} />
              </Grid>
            )}

            {opportunity.details?.expiration && (
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Expiration
                </Typography>
                <Chip label={opportunity.details.expiration} />
              </Grid>
            )}

            {opportunity.details?.rewards_structure && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Rewards Structure
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {opportunity.details.rewards_structure.base_rewards && (
                    <Typography variant="body2" gutterBottom>
                      Base Rewards: {opportunity.details.rewards_structure.base_rewards}
                    </Typography>
                  )}
                  {opportunity.details.rewards_structure.welcome_bonus && (
                    <Typography variant="body2" gutterBottom>
                      Welcome Bonus: {opportunity.details.rewards_structure.welcome_bonus}
                    </Typography>
                  )}
                  {opportunity.details.rewards_structure.bonus_categories && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Bonus Categories:
                      </Typography>
                      <Grid container spacing={1}>
                        {opportunity.details.rewards_structure.bonus_categories.map(
                          (category, index) => (
                            <Grid item key={index}>
                              <Chip
                                label={`${category.category}: ${category.rate}`}
                                variant="outlined"
                                size="small"
                              />
                            </Grid>
                          )
                        )}
                      </Grid>
                    </Box>
                  )}
                </Box>
              </Grid>
            )}

            {opportunity.type === 'brokerage' && (
              <>
                {opportunity.details?.options_trading && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Options Trading
                    </Typography>
                    <Chip label={opportunity.details.options_trading} />
                  </Grid>
                )}

                {opportunity.details?.ira_accounts && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      IRA Accounts
                    </Typography>
                    <Chip label={opportunity.details.ira_accounts} />
                  </Grid>
                )}
              </>
            )}
          </Grid>
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

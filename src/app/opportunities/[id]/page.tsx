'use client';

import { ArrowBack } from '@mui/icons-material';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React from 'react';

import { useOpportunity } from '@/lib/hooks/useOpportunity';

export default function OpportunityDetailsPage() {
  const params = useParams<{ id: string }>();
  const { data: opportunity, isLoading, error } = useOpportunity(params.id);

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Typography>Loading opportunity details...</Typography>
        </Box>
      </Container>
    );
  }

  if (error || !opportunity) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Link href="/opportunities" style={{ textDecoration: 'none' }}>
          <Button startIcon={<ArrowBack />} variant="outlined" sx={{ mb: 3 }}>
            Back to Opportunities
          </Button>
        </Link>
        <Typography color="error">
          {error instanceof Error ? error.message : 'Opportunity not found'}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Link href="/opportunities" style={{ textDecoration: 'none' }}>
        <Button
          startIcon={<ArrowBack />}
          variant="outlined"
          sx={{
            mb: 4,
            color: 'text.secondary',
            borderColor: 'divider',
            '&:hover': {
              borderColor: 'primary.main',
            },
          }}
        >
          Back to Opportunities
        </Button>
      </Link>

      <Box sx={{ px: 3 }}>
        {/* Title */}
        <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 4 }}>
          {opportunity.name}
        </Typography>

        {/* Type and Value */}
        <Stack direction="row" spacing={8} sx={{ mb: 4 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Type
            </Typography>
            <Typography>{opportunity.type}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Value
            </Typography>
            <Typography>${opportunity.value.toLocaleString()}</Typography>
          </Box>
        </Stack>

        {/* Bonus Details */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Bonus Details
          </Typography>
          <Typography sx={{ mb: 2 }}>{opportunity.bonus?.description}</Typography>

          {opportunity.bonus?.requirements && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Requirements
              </Typography>
              <Typography>{opportunity.bonus.requirements.description}</Typography>
            </Box>
          )}

          {opportunity.bonus?.tiers && opportunity.bonus.tiers.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Bonus Tiers
              </Typography>
              <Stack spacing={2}>
                {opportunity.bonus.tiers.map((tier, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Typography variant="subtitle1" gutterBottom>
                      {tier.level}
                    </Typography>
                    <Stack spacing={1}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Value
                        </Typography>
                        <Typography>${tier.value}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Minimum Deposit
                        </Typography>
                        <Typography>${tier.minimum_deposit}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Requirements
                        </Typography>
                        <Typography>{tier.requirements}</Typography>
                      </Box>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {opportunity.bonus?.additional_info && (
            <Typography sx={{ mt: 2, fontStyle: 'italic', color: 'text.secondary' }}>
              {opportunity.bonus.additional_info}
            </Typography>
          )}
        </Box>

        {/* Account Details */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Account Details
          </Typography>

          <Stack spacing={2}>
            {opportunity.details?.account_type && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Account Type
                </Typography>
                <Typography>{opportunity.details.account_type}</Typography>
              </Box>
            )}

            {opportunity.details?.monthly_fees && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Monthly Fees
                </Typography>
                <Typography>{opportunity.details.monthly_fees.amount}</Typography>
              </Box>
            )}

            {opportunity.details?.availability && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Availability
                </Typography>
                <Typography>{opportunity.details.availability.type}</Typography>
                {opportunity.details.availability.type === 'State' && opportunity.details.availability.states && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Available in: {opportunity.details.availability.states.join(', ')}
                  </Typography>
                )}
              </Box>
            )}

            {opportunity.details?.credit_inquiry && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Credit Inquiry Type
                </Typography>
                <Typography>{opportunity.details.credit_inquiry}</Typography>
              </Box>
            )}

            {opportunity.details?.household_limit && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Household Limit
                </Typography>
                <Typography>{opportunity.details.household_limit}</Typography>
              </Box>
            )}

            {opportunity.details?.early_closure_fee && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Early Closure Fee
                </Typography>
                <Typography>{opportunity.details.early_closure_fee}</Typography>
              </Box>
            )}

            {opportunity.type === 'brokerage' && opportunity.bonus?.requirements && (
              <>
                {opportunity.bonus.requirements.trading_requirements && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Trading Requirements
                    </Typography>
                    <Typography>{opportunity.bonus.requirements.trading_requirements}</Typography>
                  </Box>
                )}
                
                {opportunity.bonus.requirements.holding_period && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Holding Period
                    </Typography>
                    <Typography>{opportunity.bonus.requirements.holding_period}</Typography>
                  </Box>
                )}

                {opportunity.bonus.requirements.minimum_deposit && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Minimum Deposit
                    </Typography>
                    <Typography>${opportunity.bonus.requirements.minimum_deposit}</Typography>
                  </Box>
                )}
              </>
            )}

            {opportunity.details?.expiration && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Expiration
                </Typography>
                <Typography>{opportunity.details.expiration}</Typography>
              </Box>
            )}
          </Stack>
        </Box>

        {/* View Offer Button */}
        {opportunity.offer_link && (
          <Button
            variant="contained"
            href={opportunity.offer_link}
            target="_blank"
            rel="noopener noreferrer"
            fullWidth
            sx={{
              mt: 4,
              py: 1.5,
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
          >
            View Offer
          </Button>
        )}
      </Box>
    </Container>
  );
}

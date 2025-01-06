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
              </Box>
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

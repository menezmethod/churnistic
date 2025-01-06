'use client';

import { ArrowBack } from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Container,
  Paper,
  Typography,
} from '@mui/material';
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

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error">
          <AlertTitle>Error Loading Opportunity</AlertTitle>
          {error instanceof Error ? error.message : 'Failed to load opportunity details'}
        </Alert>
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Link href="/opportunities" style={{ textDecoration: 'none' }}>
          <Button startIcon={<ArrowBack />} variant="outlined" sx={{ mb: 3 }}>
            Back to Opportunities
          </Button>
        </Link>

        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            {opportunity.name}
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" color="text.secondary">
              Type: {opportunity.type}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Value: ${opportunity.value.toLocaleString()}
            </Typography>
          </Box>

          {opportunity.bonus && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Bonus Details
              </Typography>
              <Typography>{opportunity.bonus.description}</Typography>
              {opportunity.bonus.requirements && (
                <Typography sx={{ mt: 2 }}>
                  Requirements: {opportunity.bonus.requirements.description}
                </Typography>
              )}
            </Box>
          )}

          {opportunity.details && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Account Details
              </Typography>
              {opportunity.details.account_type && (
                <Typography>Account Type: {opportunity.details.account_type}</Typography>
              )}
              {opportunity.details.monthly_fees?.amount && (
                <Typography>
                  Monthly Fee: ${opportunity.details.monthly_fees.amount}
                </Typography>
              )}
              {opportunity.details.credit_inquiry && (
                <Typography>
                  Credit Inquiry: {opportunity.details.credit_inquiry}
                </Typography>
              )}
            </Box>
          )}

          {opportunity.offer_link && (
            <Button
              variant="contained"
              href={opportunity.offer_link}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ mt: 4 }}
            >
              View Offer
            </Button>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

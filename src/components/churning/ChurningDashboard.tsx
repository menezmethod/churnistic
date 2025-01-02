import { Box, Container, Grid } from '@mui/material';
import React from 'react';

import { OpportunitiesGrid } from './OpportunitiesGrid';
import { RiskAssessmentCard } from './RiskAssessmentCard';
import { SummaryCard } from './SummaryCard';

import { ChurningOpportunity } from '@/types/churning';

const mockOpportunities: ChurningOpportunity[] = [
  {
    id: '1',
    type: 'credit_card',
    title: 'Chase Sapphire Preferred',
    description: 'Earn 60,000 bonus points after spending $4,000 in the first 3 months',
    value: '600',
    status: 'active',
    card_name: 'Chase Sapphire Preferred',
    bank_name: 'Chase',
    signup_bonus: '60,000 points',
    bonus_amount: '$600',
    requirements: [
      'Spend $4,000 in first 3 months',
      'No previous Sapphire bonus in 48 months',
    ],
    risk_level: 2,
    time_limit: '3 months',
    expiration: '2024-12-31',
    source: 'Chase',
  },
  {
    id: '2',
    type: 'credit_card',
    title: 'Capital One Venture',
    description: 'Earn 75,000 miles after spending $4,000 in the first 3 months',
    value: '750',
    status: 'active',
    card_name: 'Capital One Venture',
    bank_name: 'Capital One',
    signup_bonus: '75,000 miles',
    bonus_amount: '$750',
    requirements: ['Spend $4,000 in first 3 months'],
    risk_level: 1,
    time_limit: '3 months',
    expiration: '2024-12-31',
    source: 'Capital One',
  },
];

const mockRiskAssessment = {
  overview: 'Test Risk Assessment',
  overall_risk_level: 2,
};

const mockSummary = {
  overview: 'Test Summary',
  total_opportunities: 1,
  total_value: 1000,
  average_risk: 2,
};

export default function ChurningDashboard() {
  const handleRowClick = (params: { row: ChurningOpportunity }) => {
    console.log('Row clicked:', params.row.id);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <OpportunitiesGrid
              opportunities={mockOpportunities}
              onRowClick={handleRowClick}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <RiskAssessmentCard riskAssessment={mockRiskAssessment} />
              <SummaryCard summary={mockSummary} />
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

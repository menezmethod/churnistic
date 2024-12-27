import { Box, Container, Grid } from '@mui/material';
import React from 'react';

import { ChurningOpportunity } from '@/types/churning';

import { OpportunitiesGrid } from './OpportunitiesGrid';
import { RiskAssessmentCard } from './RiskAssessmentCard';
import { SummaryCard } from './SummaryCard';

const mockOpportunities: ChurningOpportunity[] = [
  {
    id: '1',
    title: 'Chase Sapphire Preferred',
    description: 'Earn 60,000 bonus points after spending $4,000 in the first 3 months',
    value: '600',
    status: 'active',
    requirements: ['Spend $4,000 in first 3 months', 'No previous Sapphire bonus in 48 months'],
    bank: 'Chase',
    type: 'credit_card',
    metadata: {
      accountType: 'credit_card',
      fees: {
        monthly: 'None',
        details: 'Annual fee: $95',
      },
      availability: {
        regions: 'Nationwide',
        household_limit: '1 per household',
      },
      lastVerified: '2024-01-01',
    },
  },
  // Add more mock opportunities as needed
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

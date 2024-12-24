import { Box, Container, Grid } from '@mui/material';
import React from 'react';

import { ChurningOpportunity } from '@/types/churning';

import { OpportunitiesGrid } from './OpportunitiesGrid';
import { RiskAssessmentCard } from './RiskAssessmentCard';
import { SummaryCard } from './SummaryCard';

const mockOpportunities = [
  {
    id: '1',
    title: 'Test Opportunity',
    description: 'Test Description',
    value: '1000',
    status: 'active',
    requirements: ['req1', 'req2'],
    risk_level: 2,
    expiration: '2024-12-31',
    source: 'test',
    type: 'credit_card'
  }
];

const mockRiskAssessment = {
  overview: 'Test Risk Assessment',
  overall_risk_level: 2
};

const mockSummary = {
  overview: 'Test Summary',
  total_opportunities: 1,
  total_value: 1000,
  average_risk: 2
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

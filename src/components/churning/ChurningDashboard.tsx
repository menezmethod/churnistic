import { Box, Container, Grid } from '@mui/material';
import React from 'react';

import { useOpportunities } from '@/lib/hooks/useOpportunities';
import { ChurningOpportunity } from '@/types/churning';

import { OpportunitiesGrid } from './OpportunitiesGrid';
import { RiskAssessmentCard } from './RiskAssessmentCard';
import { SummaryCard } from './SummaryCard';

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
  const { data: opportunities, isLoading } = useOpportunities();

  const transformedOpportunities: ChurningOpportunity[] =
    opportunities?.map((opp) => ({
      id: opp.id,
      type: opp.type,
      title: opp.name,
      description: opp.bonus?.description || '',
      value: opp.value.toString(),
      status: 'active',
      card_name: opp.name,
      bank_name: opp.bank || '',
      signup_bonus: `$${opp.value}`,
      bonus_amount: `$${opp.value}`,
      requirements: [opp.bonus?.requirements?.description || ''],
      risk_level: 1,
      time_limit: opp.details?.expiration || 'Unknown',
      expiration: opp.details?.expiration || 'Unknown',
      source: opp.metadata?.created_by || 'Unknown',
    })) || [];

  const handleRowClick = (params: { row: ChurningOpportunity }) => {
    console.log('Row clicked:', params.row.id);
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 4, mb: 4 }}>Loading...</Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <OpportunitiesGrid
              opportunities={transformedOpportunities}
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

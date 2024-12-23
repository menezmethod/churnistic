import { Grid, Box, Dialog } from '@mui/material';
import React, { useState } from 'react';

import { OpportunitiesGrid } from './OpportunitiesGrid';
import { OpportunityDetails } from './OpportunityDetails';
import { RiskAssessmentCard } from './RiskAssessmentCard';
import { SummaryCard } from './SummaryCard';

interface ChurningOpportunity {
  id: string;
  type: string;
  title: string;
  description: string;
  value: string;
  status: string;
  card_name?: string;
  bank_name?: string;
  signup_bonus?: string;
  bonus_amount?: string;
  requirements: string[];
  risk_level: number;
  time_limit?: string;
  expiration: string;
  source: string;
}

interface ChurningSummary {
  overview: string;
  total_opportunities: number;
  total_value: number;
  average_risk: number;
}

interface RiskAssessment {
  overview: string;
  overall_risk_level: number;
}

interface ChurningDashboardProps {
  opportunities: ChurningOpportunity[];
  summary: ChurningSummary;
  riskAssessment: RiskAssessment;
}

export const ChurningDashboard: React.FC<ChurningDashboardProps> = ({
  opportunities,
  summary,
  riskAssessment,
}) => {
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<ChurningOpportunity | null>(null);

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={3}>
        {/* Summary and Risk Assessment Cards */}
        <Grid item xs={12} md={6}>
          <SummaryCard summary={summary} />
        </Grid>
        <Grid item xs={12} md={6}>
          <RiskAssessmentCard riskAssessment={riskAssessment} />
        </Grid>

        {/* Opportunities Grid */}
        <Grid item xs={12}>
          <OpportunitiesGrid
            opportunities={opportunities}
            onRowClick={(params) => setSelectedOpportunity(params.row)}
          />
        </Grid>
      </Grid>

      {/* Opportunity Details Dialog */}
      <Dialog
        open={!!selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedOpportunity && (
          <Box sx={{ p: 2 }}>
            <OpportunityDetails opportunity={selectedOpportunity} />
          </Box>
        )}
      </Dialog>
    </Box>
  );
};

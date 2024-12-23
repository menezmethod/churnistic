import AssessmentIcon from '@mui/icons-material/Assessment';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { Card, CardContent, Typography, Box } from '@mui/material';
import React from 'react';

interface ChurningSummary {
  overview: string;
  total_opportunities: number;
  total_value: number;
  average_risk: number;
}

interface SummaryCardProps {
  summary: ChurningSummary;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary }) => {
  return (
    <Card sx={{ minWidth: 275, mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Summary
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <AssessmentIcon sx={{ mr: 1 }} />
          <Typography variant="body1">{summary.overview}</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <TrendingUpIcon sx={{ mr: 1 }} />
          <Typography variant="body1">
            Total Opportunities: {summary.total_opportunities}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <MonetizationOnIcon sx={{ mr: 1 }} />
          <Typography variant="body1">
            Total Value: ${summary.total_value.toLocaleString()}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AssessmentIcon sx={{ mr: 1 }} />
          <Typography variant="body1">
            Average Risk: {summary.average_risk.toFixed(1)}/10
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

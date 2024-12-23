import SecurityIcon from '@mui/icons-material/Security';
import WarningIcon from '@mui/icons-material/Warning';
import { Card, CardContent, Typography, Box, LinearProgress } from '@mui/material';
import React from 'react';

interface RiskAssessmentData {
  overview: string;
  overall_risk_level: number;
}

interface RiskAssessmentCardProps {
  riskAssessment: RiskAssessmentData;
}

const getRiskColor = (risk: number): string => {
  if (risk <= 3) return '#4caf50'; // Green
  if (risk <= 6) return '#ff9800'; // Orange
  return '#f44336'; // Red
};

export const RiskAssessmentCard: React.FC<RiskAssessmentCardProps> = ({
  riskAssessment,
}) => {
  const riskColor = getRiskColor(riskAssessment.overall_risk_level);

  return (
    <Card sx={{ minWidth: 275 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <SecurityIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Risk Assessment</Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <WarningIcon sx={{ mr: 1, color: riskColor }} />
          <Typography variant="body1">{riskAssessment.overview}</Typography>
        </Box>

        <Box sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Overall Risk Level: {riskAssessment.overall_risk_level.toFixed(1)}/10
          </Typography>
          <LinearProgress
            variant="determinate"
            value={riskAssessment.overall_risk_level * 10}
            sx={{
              mt: 1,
              height: 8,
              borderRadius: 5,
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: riskColor,
                borderRadius: 5,
              },
            }}
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {riskAssessment.overall_risk_level <= 3
            ? '✅ Low Risk'
            : riskAssessment.overall_risk_level <= 6
              ? '⚠️ Moderate Risk'
              : '🚨 High Risk'}
        </Typography>
      </CardContent>
    </Card>
  );
};

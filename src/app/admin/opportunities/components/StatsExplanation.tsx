'use client';

import { Info as InfoIcon } from '@mui/icons-material';
import { Tooltip, Typography, Box, Stack } from '@mui/material';

export const StatsExplanation = () => {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Statistics Overview
      </Typography>
      <Stack spacing={1}>
        <Tooltip title="Total number of opportunities in the system, including both pending and approved">
          <Typography variant="body2">
            <InfoIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
            Total Opportunities: All opportunities in the system
          </Typography>
        </Tooltip>
        <Tooltip title="Number of opportunities currently awaiting review and approval">
          <Typography variant="body2">
            <InfoIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
            Pending Review: Opportunities awaiting approval
          </Typography>
        </Tooltip>
        <Tooltip title="Number of opportunities that have been approved and are active">
          <Typography variant="body2">
            <InfoIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
            Approved: Active opportunities
          </Typography>
        </Tooltip>
        <Tooltip title="Number of opportunities by type (Bank, Credit Card, Brokerage) currently pending review">
          <Typography variant="body2">
            <InfoIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
            By Type: Pending opportunities categorized by type
          </Typography>
        </Tooltip>
        <Tooltip title="Number of high-value opportunities ($500+) currently pending review">
          <Typography variant="body2">
            <InfoIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
            High Value: Pending opportunities worth $500 or more
          </Typography>
        </Tooltip>
      </Stack>
    </Box>
  );
};

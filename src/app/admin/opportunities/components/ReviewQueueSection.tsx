'use client';

import { Box, Typography, useTheme, alpha } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';

import { OpportunityDataGrid } from './OpportunityDataGrid';
import { Opportunity } from '../types/opportunity';

interface ReviewQueueSectionProps {
  opportunities: Opportunity[];
  onPreview: (opportunity: Opportunity) => void;
  onApprove: (opportunity: Opportunity) => void;
  onReject: (opportunity: Opportunity) => void;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  columns: GridColDef[];
}

export const ReviewQueueSection = ({
  opportunities,
  columns,
}: ReviewQueueSectionProps) => {
  const theme = useTheme();
  const reviewOpportunities = opportunities.filter((opp) => {
    // Check if the opportunity is expired
    const expiryDate = opp.details?.expiration;
    if (!expiryDate) return false;

    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry < today;
  });

  if (reviewOpportunities.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: `1px solid ${theme.palette.warning.main}`,
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.warning.light, 0.1),
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: theme.palette.warning.main,
            fontSize: { xs: '1rem', sm: '1.125rem' },
          }}
        >
          Needs Extra Review ({reviewOpportunities.length})
        </Typography>
        <Typography variant="body2" color="text.secondary">
          These opportunities have passed their expiration date and need review
        </Typography>
      </Box>

      <Box
        sx={{
          p: { xs: 1.5, sm: 2 },
          height: reviewOpportunities.length <= 7 ? 'auto' : 400,
        }}
      >
        <OpportunityDataGrid
          rows={reviewOpportunities}
          columns={columns}
          loading={false}
          autoHeight={reviewOpportunities.length <= 7}
          getRowClassName={(params) => `opportunity-row-${params.row.status}`}
          disableColumnMenu
          disableColumnFilter
          disableColumnSelector
          disableDensitySelector
          hideFooterSelectedRowCount
        />
      </Box>
    </Box>
  );
};

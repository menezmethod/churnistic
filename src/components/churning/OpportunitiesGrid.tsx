import { Box, Typography } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import React from 'react';

interface ChurningOpportunity {
  id: string;
  type: 'credit_card' | 'bank_account' | 'brokerage';
  title: string;
  description: string;
  value: string;
  status: string;
  bank: string;
  requirements: string[];
  metadata?: {
    accountType: string;
    fees: {
      monthly: string;
      details: string;
    };
    availability: {
      regions: string;
      household_limit: string;
    };
    lastVerified: string;
  };
}

const columns: GridColDef[] = [
  { field: 'type', headerName: 'Type', width: 130 },
  { field: 'bank', headerName: 'Bank', width: 200 },
  { field: 'title', headerName: 'Title', width: 300 },
  {
    field: 'value',
    headerName: 'Value',
    width: 130,
    valueFormatter: (params) => {
      if (typeof params.value === 'number') {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(params.value);
      }
      return params.value;
    },
  },
  {
    field: 'requirements',
    headerName: 'Requirements',
    width: 300,
    renderCell: (params) => (
      <div style={{ whiteSpace: 'pre-wrap' }}>{params.value.join(', ')}</div>
    ),
  },
  {
    field: 'regions',
    headerName: 'Availability',
    width: 200,
    valueGetter: (params) => params.row.metadata?.availability?.regions || 'Unknown',
  },
];

interface OpportunitiesGridProps {
  opportunities: ChurningOpportunity[];
  onRowClick: (params: { row: ChurningOpportunity }) => void;
}

export const OpportunitiesGrid: React.FC<OpportunitiesGridProps> = ({
  opportunities,
  onRowClick,
}) => {
  return (
    <Box sx={{ width: '100%', height: 600 }}>
      <Typography variant="h6" gutterBottom>
        Available Opportunities ({opportunities.length})
      </Typography>
      <DataGrid
        rows={opportunities}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 10 },
          },
          sorting: {
            sortModel: [{ field: 'value', sort: 'desc' }],
          },
        }}
        pageSizeOptions={[10, 25, 50]}
        checkboxSelection
        disableRowSelectionOnClick
        onRowClick={onRowClick}
      />
    </Box>
  );
};

import { Box, Typography } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import React from 'react';

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

const columns: GridColDef[] = [
  { field: 'type', headerName: 'Type', width: 130 },
  { field: 'title', headerName: 'Title', width: 200 },
  { field: 'description', headerName: 'Description', width: 300 },
  { field: 'value', headerName: 'Value', width: 130 },
  { field: 'risk_level', headerName: 'Risk Level', width: 130 },
  { field: 'expiration', headerName: 'Expiration', width: 130 },
  {
    field: 'requirements',
    headerName: 'Requirements',
    width: 300,
    renderCell: (params) => (
      <div style={{ whiteSpace: 'pre-wrap' }}>{params.value.join(', ')}</div>
    ),
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
    <Box sx={{ width: '100%', height: 400 }}>
      <Typography variant="h6" gutterBottom>
        Churning Opportunities
      </Typography>
      <DataGrid
        rows={opportunities}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 5 },
          },
        }}
        pageSizeOptions={[5, 10]}
        checkboxSelection
        disableRowSelectionOnClick
        onRowClick={onRowClick}
      />
    </Box>
  );
};

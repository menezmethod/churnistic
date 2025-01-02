import { Box } from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridValueGetterParams,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import React from 'react';

import { ChurningOpportunity } from '@/types/churning';

interface OpportunitiesGridProps {
  opportunities: ChurningOpportunity[];
  onRowClick: (params: { row: ChurningOpportunity }) => void;
}

const columns: GridColDef[] = [
  { field: 'type', headerName: 'Type', width: 130 },
  { field: 'bank_name', headerName: 'Bank', width: 200 },
  { field: 'title', headerName: 'Title', width: 300 },
  {
    field: 'value',
    headerName: 'Value',
    width: 130,
    valueFormatter: (params: GridValueGetterParams) => {
      if (typeof params.value === 'string') {
        const value = parseFloat(params.value);
        if (!isNaN(value)) {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(value);
        }
      }
      return params.value;
    },
  },
  {
    field: 'requirements',
    headerName: 'Requirements',
    width: 300,
    renderCell: (params: GridRenderCellParams<ChurningOpportunity, string[]>) => (
      <div style={{ whiteSpace: 'pre-wrap' }}>{params.value?.join(', ')}</div>
    ),
  },
  {
    field: 'risk_level',
    headerName: 'Risk Level',
    width: 130,
    valueFormatter: (params: GridValueGetterParams) => {
      const riskLevels = ['Low', 'Medium', 'High'];
      return riskLevels[Number(params.value) - 1] || 'Unknown';
    },
  },
];

export function OpportunitiesGrid({ opportunities, onRowClick }: OpportunitiesGridProps) {
  return (
    <Box sx={{ width: '100%', height: 600 }}>
      <DataGrid
        rows={opportunities}
        columns={columns}
        onRowClick={onRowClick}
        disableRowSelectionOnClick
        autoHeight
      />
    </Box>
  );
}

import { Box } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import React from 'react';

import { ChurningOpportunity } from '@/types/churning';

interface OpportunitiesGridProps {
  opportunities: ChurningOpportunity[];
  onRowClick: (params: { row: ChurningOpportunity }) => void;
}

const columns: GridColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 90,
  },
  {
    field: 'name',
    headerName: 'Name',
    width: 130,
  },
  {
    field: 'amount',
    headerName: 'Amount',
    width: 130,
    valueFormatter: ({ value }) => {
      if (typeof value === 'string') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          return `$${numValue.toLocaleString()}`;
        }
      }
      return value;
    },
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 130,
  },
  {
    field: 'riskLevel',
    headerName: 'Risk Level',
    width: 130,
    valueFormatter: ({ value }) => {
      const riskLevels = ['Low', 'Medium', 'High'];
      return riskLevels[Number(value) - 1] || 'Unknown';
    },
  },
  {
    field: 'lastContact',
    headerName: 'Last Contact',
    width: 130,
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

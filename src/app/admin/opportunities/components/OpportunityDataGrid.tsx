'use client';

import { Box, alpha, useTheme } from '@mui/material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';

import { Opportunity } from '../types/opportunity';

interface OpportunityDataGridProps {
  rows: Opportunity[];
  columns: GridColDef[];
  loading: boolean;
  autoHeight?: boolean;
  getRowClassName?: (params: GridRowParams<Opportunity>) => string;
}

export const OpportunityDataGrid = ({
  rows,
  columns,
  loading,
  autoHeight = false,
  getRowClassName,
}: OpportunityDataGridProps) => {
  const theme = useTheme();

  return (
    <Box sx={{ flex: 1, minHeight: 0 }}>
      <DataGrid
        rows={rows}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 20, page: 0 },
          },
        }}
        pageSizeOptions={[10, 20, 50]}
        disableRowSelectionOnClick
        getRowId={(row) => row.id}
        loading={loading}
        disableColumnMenu
        autoHeight={autoHeight}
        getRowClassName={getRowClassName}
        sx={{
          '& .opportunity-row-staged': {
            bgcolor: alpha(theme.palette.info.main, 0.04),
          },
          '& .opportunity-row-approved': {
            bgcolor: alpha(theme.palette.success.main, 0.04),
          },
          height: autoHeight ? 'auto' : '100%',
          '& .MuiDataGrid-root': {
            border: 'none',
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: alpha(theme.palette.background.default, 0.8),
              borderBottom: `1px solid ${theme.palette.divider}`,
            },
            '& .MuiDataGrid-virtualScroller': {
              backgroundColor: theme.palette.background.paper,
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: `1px solid ${theme.palette.divider}`,
            },
            '& .MuiDataGrid-cell': {
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            },
          },
        }}
      />
    </Box>
  );
};

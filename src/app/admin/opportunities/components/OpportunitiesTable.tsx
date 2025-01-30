'use client';

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
} from '@mui/material';

import type { OpportunityWithStaged } from '@/app/admin/opportunities/types/opportunity';

import { OpportunityTableRow } from './OpportunityTableRow';
import { PaginationConfig } from '../types/pagination';

interface OpportunitiesTableProps {
  opportunities: OpportunityWithStaged[];
  pagination: PaginationConfig;
  hasMore: boolean;
  onPaginationChange: (newPage: number, newPageSize: number) => void;
  onSortChange: (field: string) => void;
  onPreview: (opportunity: OpportunityWithStaged) => void;
  onApprove: (opportunity: OpportunityWithStaged) => void;
  onReject: (opportunity: OpportunityWithStaged) => void;
}

export const OpportunitiesTable = ({
  opportunities,
  pagination,
  hasMore,
  onPaginationChange,
  onSortChange,
  onPreview,
  onApprove,
  onReject,
}: OpportunitiesTableProps) => {
  const handleChangePage = (_: unknown, newPage: number) => {
    onPaginationChange(newPage + 1, pagination.pageSize);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onPaginationChange(1, parseInt(event.target.value, 10));
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <TableSortLabel
                active={pagination.sortBy === 'name'}
                direction={pagination.sortDirection}
                onClick={() => onSortChange('name')}
              >
                Name
              </TableSortLabel>
            </TableCell>
            <TableCell>Type</TableCell>
            <TableCell>
              <TableSortLabel
                active={pagination.sortBy === 'value'}
                direction={pagination.sortDirection}
                onClick={() => onSortChange('value')}
              >
                Value
              </TableSortLabel>
            </TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {opportunities
            .filter(
              (opp, index, self) =>
                // Only keep the first occurrence of each ID
                index === self.findIndex((o) => o.id === opp.id)
            )
            .map((opportunity) => (
              <OpportunityTableRow
                key={opportunity.id}
                opportunity={opportunity}
                onPreview={onPreview}
                onApprove={onApprove}
                onReject={onReject}
              />
            ))}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={-1} // We don't know the total count, so use -1 for infinite scroll
        page={pagination.page - 1}
        rowsPerPage={pagination.pageSize}
        rowsPerPageOptions={[10, 20, 50]}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        nextIconButtonProps={{
          disabled: !hasMore,
        }}
      />
    </TableContainer>
  );
};

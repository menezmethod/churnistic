'use client';

import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Typography,
  Chip,
  Box,
  Stack,
  IconButton,
} from '@mui/material';
import { useState } from 'react';

import { Opportunity } from '../types/opportunity';

interface OpportunitiesTableProps {
  opportunities: Opportunity[];
  canManageOpportunities: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export const OpportunitiesTable = ({
  opportunities,
  canManageOpportunities,
  onApprove,
  onReject,
}: OpportunitiesTableProps) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <TableContainer component={Paper} sx={{ marginBottom: 2 }}>
      <Table sx={{ minWidth: 800 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ paddingLeft: 2, paddingRight: 2 }}>Offer Details</TableCell>
            <TableCell sx={{ paddingLeft: 2, paddingRight: 2 }}>Source</TableCell>
            <TableCell sx={{ paddingLeft: 2, paddingRight: 2 }}>Requirements</TableCell>
            <TableCell sx={{ paddingLeft: 2, paddingRight: 2 }}>AI Insights</TableCell>
            {canManageOpportunities && (
              <TableCell align="right" sx={{ paddingLeft: 2, paddingRight: 2 }}>
                Actions
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {opportunities
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((opp) => (
              <TableRow key={opp.id} hover>
                <TableCell sx={{ paddingLeft: 2, paddingRight: 2 }}>
                  <Box>
                    <Typography variant="subtitle2">{opp.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {opp.bonus.title}
                    </Typography>
                    <Chip
                      size="small"
                      label={opp.type === 'credit_card' ? 'Credit Card' : 'Bank Account'}
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </TableCell>
                <TableCell sx={{ paddingLeft: 2, paddingRight: 2 }}>
                  <Typography variant="body2">{opp.source.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(opp.source.collected_at).toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell sx={{ paddingLeft: 2, paddingRight: 2 }}>
                  {opp.bonus.requirements.map((req, index) => (
                    <Typography key={index} variant="body2">
                      {req.type === 'spend'
                        ? `Spend $${req.details.amount} in ${req.details.period} days`
                        : `Direct deposit $${req.details.amount} in ${req.details.period} days`}
                    </Typography>
                  ))}
                </TableCell>
                <TableCell sx={{ paddingLeft: 2, paddingRight: 2 }}>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      Confidence: {(opp.ai_insights.confidence_score * 100).toFixed(0)}%
                    </Typography>
                    {opp.ai_insights.validation_warnings.map((warning, index) => (
                      <Chip
                        key={index}
                        size="small"
                        icon={<WarningIcon />}
                        label={warning}
                        color="warning"
                      />
                    ))}
                    {opp.ai_insights.potential_duplicates.length > 0 && (
                      <Chip
                        size="small"
                        icon={<WarningIcon />}
                        label={`${opp.ai_insights.potential_duplicates.length} potential duplicate(s)`}
                        color="warning"
                      />
                    )}
                  </Stack>
                </TableCell>
                {canManageOpportunities && (
                  <TableCell align="right" sx={{ paddingLeft: 2, paddingRight: 2 }}>
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton
                        color="success"
                        size="small"
                        onClick={() => onApprove(opp.id)}
                      >
                        <ApproveIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => onReject(opp.id)}
                      >
                        <RejectIcon />
                      </IconButton>
                    </Stack>
                  </TableCell>
                )}
              </TableRow>
            ))}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={opportunities.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{ paddingRight: 2 }}
      />
    </TableContainer>
  );
};

'use client';

import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as PreviewIcon,
} from '@mui/icons-material';
import {
  Box,
  Chip,
  IconButton,
  Stack,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';

import type { OpportunityWithStaged } from '@/app/admin/opportunities/types/opportunity';

interface OpportunityTableRowProps {
  opportunity: OpportunityWithStaged;
  onPreview: (opportunity: OpportunityWithStaged) => void;
  onApprove: (opportunity: OpportunityWithStaged) => void;
  onReject: (opportunity: OpportunityWithStaged) => void;
}

const getStatusChip = (status: string) => {
  switch (status) {
    case 'staged':
      return <Chip label="Staged" color="info" size="small" />;
    case 'pending':
      return <Chip label="Pending" color="warning" size="small" />;
    case 'approved':
      return <Chip label="Approved" color="success" size="small" />;
    case 'rejected':
      return <Chip label="Rejected" color="error" size="small" />;
    default:
      return null;
  }
};

export const OpportunityTableRow = ({
  opportunity,
  onPreview,
  onApprove,
  onReject,
}: OpportunityTableRowProps) => {
  return (
    <TableRow hover sx={opportunity.isStaged ? { bgcolor: 'action.hover' } : undefined}>
      <TableCell>
        <Stack direction="row" alignItems="center" spacing={2}>
          {opportunity.logo && (
            <Box
              component="img"
              src={opportunity.logo.url}
              alt={opportunity.name}
              sx={{ width: 24, height: 24, objectFit: 'contain' }}
            />
          )}
          <Typography>{opportunity.name}</Typography>
        </Stack>
      </TableCell>
      <TableCell>
        <Chip
          label={opportunity.type}
          size="small"
          color={opportunity.type === 'bank' ? 'success' : 'info'}
        />
      </TableCell>
      <TableCell>
        <Typography color="success.main" fontWeight="bold">
          ${opportunity.value}
        </Typography>
      </TableCell>
      <TableCell>{getStatusChip(opportunity.status)}</TableCell>
      <TableCell align="right">
        <IconButton onClick={() => onPreview(opportunity)} color="primary">
          <PreviewIcon />
        </IconButton>
        <IconButton
          color="success"
          onClick={() => onApprove(opportunity)}
          disabled={
            opportunity.status === 'approved' || opportunity.status === 'rejected'
          }
        >
          <ApproveIcon />
        </IconButton>
        <IconButton
          color="error"
          onClick={() => onReject(opportunity)}
          disabled={
            opportunity.status === 'approved' || opportunity.status === 'rejected'
          }
        >
          <RejectIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

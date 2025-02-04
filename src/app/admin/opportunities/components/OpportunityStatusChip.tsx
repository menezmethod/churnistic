'use client';

import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  PendingActions as PendingIcon,
} from '@mui/icons-material';
import { Chip } from '@mui/material';

type OpportunityStatus = 'staged' | 'pending' | 'approved' | 'rejected';

interface StatusConfig {
  label: string;
  color: 'info' | 'warning' | 'success' | 'error' | 'default';
  icon: React.ReactElement;
}

interface OpportunityStatusChipProps {
  status: OpportunityStatus;
}

const statusConfigs: Record<OpportunityStatus, StatusConfig> = {
  staged: {
    label: 'Staged',
    color: 'info',
    icon: <PendingIcon sx={{ fontSize: 16, mr: 0.5 }} />,
  },
  pending: {
    label: 'Pending',
    color: 'warning',
    icon: <PendingIcon sx={{ fontSize: 16, mr: 0.5 }} />,
  },
  approved: {
    label: 'Approved',
    color: 'success',
    icon: <ApproveIcon sx={{ fontSize: 16, mr: 0.5 }} />,
  },
  rejected: {
    label: 'Rejected',
    color: 'error',
    icon: <RejectIcon sx={{ fontSize: 16, mr: 0.5 }} />,
  },
};

export const OpportunityStatusChip = ({ status }: OpportunityStatusChipProps) => {
  const statusConfig = statusConfigs[status] || {
    label: status,
    color: 'default',
    icon: null,
  };

  return (
    <Chip
      {...(statusConfig.icon ? { icon: statusConfig.icon } : {})}
      label={statusConfig.label}
      size="small"
      color={statusConfig.color}
      sx={{ fontWeight: 500 }}
    />
  );
};

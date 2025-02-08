'use client';

import {
  CheckCircle as ApproveIcon,
  Close as RejectIcon,
  RemoveRedEye as PreviewIcon,
} from '@mui/icons-material';
import { IconButton, Tooltip, Stack, CircularProgress } from '@mui/material';

import { useOpportunities } from '../hooks/useOpportunities';
import { Opportunity } from '../types/opportunity';

interface OpportunityActionButtonsProps {
  opportunity: Opportunity;
  onPreview?: (opportunity: Opportunity) => void;
  onApprove?: (opportunity: Opportunity) => void;
  onReject?: (opportunity: Opportunity) => void;
  showApprove?: boolean;
  showReject?: boolean;
  showPreview?: boolean;
  rejectTooltip?: string;
}

export const OpportunityActionButtons = ({
  opportunity,
  onPreview,
  onApprove,
  onReject,
  showApprove = true,
  showReject = true,
  showPreview = true,
  rejectTooltip = 'Reject',
}: OpportunityActionButtonsProps) => {
  const { loadingStates } = useOpportunities();

  // Early return if opportunity is not defined or doesn't have an id
  if (!opportunity?.id) {
    return null;
  }

  const isLoading = loadingStates[opportunity.id] || false;

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {showPreview && onPreview && (
        <Tooltip title="Preview">
          <span>
            {' '}
            {/* Wrap disabled button in span for tooltip to work */}
            <IconButton
              onClick={() => onPreview(opportunity)}
              size="small"
              disabled={isLoading}
            >
              <PreviewIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}

      {showApprove && onApprove && (
        <Tooltip title="Approve">
          <span>
            {' '}
            {/* Wrap disabled button in span for tooltip to work */}
            <IconButton
              onClick={() => onApprove(opportunity)}
              size="small"
              color="success"
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <ApproveIcon fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
      )}

      {showReject && onReject && (
        <Tooltip title={rejectTooltip}>
          <span>
            {' '}
            {/* Wrap disabled button in span for tooltip to work */}
            <IconButton
              onClick={() => onReject(opportunity)}
              size="small"
              color="error"
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <RejectIcon fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
      )}
    </Stack>
  );
};

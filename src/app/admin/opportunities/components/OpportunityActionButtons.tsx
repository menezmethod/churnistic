'use client';

import {
  CheckCircle as ApproveIcon,
  Close as RejectIcon,
  Visibility as PreviewIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';
import { IconButton, Stack, Tooltip, alpha, useTheme } from '@mui/material';
import { useState } from 'react';

import { MarkForReviewDialog } from './dialogs/MarkForReviewDialog';

interface OpportunityActionButtonsProps {
  onPreview: () => void;
  onApprove?: () => void;
  onReject: () => void;
  onMarkForReview?: (reason: string) => void;
  showApprove?: boolean;
  rejectTooltip?: string;
}

export const OpportunityActionButtons = ({
  onPreview,
  onApprove,
  onReject,
  onMarkForReview,
  showApprove = true,
  rejectTooltip = 'Reject',
}: OpportunityActionButtonsProps) => {
  const theme = useTheme();
  const [markForReviewOpen, setMarkForReviewOpen] = useState(false);

  return (
    <>
      <Stack direction="row" spacing={1}>
        <Tooltip title="Preview opportunity details" arrow>
          <IconButton
            onClick={onPreview}
            color="primary"
            size="small"
            sx={{
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
              },
            }}
          >
            <PreviewIcon />
          </IconButton>
        </Tooltip>

        {showApprove && onApprove && (
          <Tooltip title="Approve opportunity" arrow>
            <IconButton
              onClick={onApprove}
              color="success"
              size="small"
              sx={{
                '&:hover': {
                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                },
              }}
            >
              <ApproveIcon />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title={rejectTooltip} arrow>
          <IconButton
            onClick={onReject}
            color="error"
            size="small"
            sx={{
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.1),
              },
            }}
          >
            <RejectIcon />
          </IconButton>
        </Tooltip>

        {onMarkForReview && (
          <Tooltip title="Mark for Review">
            <IconButton
              onClick={() => setMarkForReviewOpen(true)}
              size="small"
              sx={{ color: 'warning.main' }}
            >
              <FlagIcon />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      <MarkForReviewDialog
        open={markForReviewOpen}
        onClose={() => setMarkForReviewOpen(false)}
        onConfirm={(reason) => {
          onMarkForReview?.(reason);
          setMarkForReviewOpen(false);
        }}
      />
    </>
  );
};

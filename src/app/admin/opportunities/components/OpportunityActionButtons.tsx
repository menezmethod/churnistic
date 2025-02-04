'use client';

import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as PreviewIcon,
} from '@mui/icons-material';
import { IconButton, Stack, Tooltip, alpha, useTheme } from '@mui/material';

interface OpportunityActionButtonsProps {
  onPreview: () => void;
  onApprove?: () => void;
  onReject: () => void;
  showApprove?: boolean;
  rejectTooltip?: string;
}

export const OpportunityActionButtons = ({
  onPreview,
  onApprove,
  onReject,
  showApprove = true,
  rejectTooltip = 'Reject opportunity',
}: OpportunityActionButtonsProps) => {
  const theme = useTheme();

  return (
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
    </Stack>
  );
};

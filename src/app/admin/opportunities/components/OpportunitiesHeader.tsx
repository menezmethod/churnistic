'use client';

import {
  CloudDownload as ImportIcon,
  DoneAll as BulkApproveIcon,
  RestartAlt as ResetIcon,
  DeleteForever as ResetAllIcon,
} from '@mui/icons-material';
import {
  Box,
  CircularProgress,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';

interface OpportunitiesHeaderProps {
  isLoading: boolean;
  isBulkApproving: boolean;
  isResettingStagedOffers: boolean;
  isResettingOpportunities: boolean;
  hasStagedOpportunities: boolean;
  stats: { total: number };
  onImport: () => void;
  onBulkApprove: () => void;
  onResetStaged: () => void;
  onResetAll: () => void;
}

export const OpportunitiesHeader = ({
  isLoading,
  isBulkApproving,
  isResettingStagedOffers,
  isResettingOpportunities,
  hasStagedOpportunities,
  stats,
  onImport,
  onBulkApprove,
  onResetStaged,
  onResetAll,
}: OpportunitiesHeaderProps) => {
  return (
    <Box sx={{ mb: { xs: 2, sm: 3 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={{ xs: 2, sm: 0 }}
      >
        <Stack spacing={0.5}>
          <Typography
            variant="h4"
            fontWeight="500"
            color="text.primary"
            sx={{
              letterSpacing: -0.5,
              fontSize: { xs: '1.5rem', sm: '2rem' },
            }}
          >
            Opportunities
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Manage and review financial opportunities
          </Typography>
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'space-between', sm: 'flex-start' },
          }}
        >
          <Tooltip
            title={isLoading ? 'Importing...' : 'Import new opportunities'}
            arrow
            placement="bottom"
          >
            <span>
              <IconButton
                color="primary"
                onClick={onImport}
                disabled={isLoading}
                sx={{
                  borderRadius: 1,
                  position: 'relative',
                  p: 1.5,
                  '&:hover': {
                    bgcolor: alpha('#000', 0.08),
                  },
                }}
              >
                {isLoading ? (
                  <CircularProgress size={20} color="primary" />
                ) : (
                  <ImportIcon sx={{ fontSize: 20 }} />
                )}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip
            title={isBulkApproving ? 'Processing...' : 'Approve all staged'}
            arrow
            placement="bottom"
          >
            <span>
              <IconButton
                color="success"
                onClick={onBulkApprove}
                disabled={isBulkApproving || !hasStagedOpportunities}
                sx={{
                  borderRadius: 1,
                  position: 'relative',
                  p: 1.5,
                  '&:hover': {
                    bgcolor: alpha('#000', 0.08),
                  },
                }}
              >
                {isBulkApproving ? (
                  <CircularProgress size={20} color="success" />
                ) : (
                  <BulkApproveIcon sx={{ fontSize: 20 }} />
                )}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip
            title={isResettingStagedOffers ? 'Clearing...' : 'Clear staged offers'}
            arrow
            placement="bottom"
          >
            <span>
              <IconButton
                color="warning"
                onClick={onResetStaged}
                disabled={isResettingStagedOffers || !hasStagedOpportunities}
                sx={{
                  borderRadius: 1,
                  position: 'relative',
                  p: 1.5,
                  '&:hover': {
                    bgcolor: alpha('#000', 0.08),
                  },
                }}
              >
                {isResettingStagedOffers ? (
                  <CircularProgress size={20} color="warning" />
                ) : (
                  <ResetIcon sx={{ fontSize: 20 }} />
                )}
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip
            title={isResettingOpportunities ? 'Resetting...' : 'Reset all data'}
            arrow
            placement="bottom"
          >
            <span>
              <IconButton
                color="error"
                onClick={onResetAll}
                disabled={isResettingOpportunities || stats.total === 0}
                sx={{
                  borderRadius: 1,
                  position: 'relative',
                  p: 1.5,
                  '&:hover': {
                    bgcolor: alpha('#000', 0.08),
                  },
                }}
              >
                {isResettingOpportunities ? (
                  <CircularProgress size={20} color="error" />
                ) : (
                  <ResetAllIcon sx={{ fontSize: 20 }} />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>
    </Box>
  );
};

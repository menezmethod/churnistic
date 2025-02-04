'use client';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Switch,
  Alert,
  Box,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import { useOpportunityApproval } from '../../hooks/useOpportunityApproval';

interface BulkApproveDialogProps {
  open: boolean;
  onClose: () => void;
}

export const BulkApproveDialog = ({ open, onClose }: BulkApproveDialogProps) => {
  const [force, setForce] = useState(false);
  const { approveOffers, isApproving, error } = useOpportunityApproval();
  const [result, setResult] = useState<{
    skippedOffers: Array<{ id: string; name: string; reason?: string }>;
    approved: number;
  } | null>(null);

  const handleApprove = async () => {
    try {
      const result = await approveOffers(force);
      setResult(result);

      // If no skipped offers or force mode, close the dialog
      if (force || result.skippedOffers.length === 0) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to approve offers:', error);
    }
  };

  const handleClose = () => {
    setResult(null);
    setForce(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {result ? 'Approval Results' : 'Approve All Staged Opportunities'}
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error instanceof Error ? error.message : 'Failed to approve opportunities'}
          </Alert>
        )}

        {!result ? (
          <>
            <DialogContentText>
              Are you sure you want to approve all staged opportunities? This will process
              all pending opportunities in the system.
            </DialogContentText>
            <FormControlLabel
              control={
                <Switch
                  checked={force}
                  onChange={(e) => setForce(e.target.checked)}
                  color="warning"
                />
              }
              label="Force approve (includes opportunities that need review)"
            />
          </>
        ) : (
          <Box>
            <Typography variant="body1" gutterBottom>
              Successfully approved {result.approved} opportunities.
            </Typography>

            {result.skippedOffers.length > 0 && (
              <>
                <Typography variant="body1" color="warning.main" sx={{ mt: 2, mb: 1 }}>
                  The following {result.skippedOffers.length} opportunities were skipped
                  (need review):
                </Typography>
                <Box
                  sx={{
                    maxHeight: 200,
                    overflow: 'auto',
                    bgcolor: 'grey.50',
                    p: 2,
                    borderRadius: 1,
                  }}
                >
                  {result.skippedOffers.map((offer) => (
                    <Typography key={offer.id} variant="body2" gutterBottom>
                      • {offer.name}
                      {offer.reason && (
                        <Typography component="span" color="text.secondary">
                          {' '}
                          - {offer.reason}
                        </Typography>
                      )}
                    </Typography>
                  ))}
                </Box>
              </>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          {result?.skippedOffers.length ? 'Close' : 'Cancel'}
        </Button>
        {!result && (
          <Button
            onClick={handleApprove}
            color={force ? 'warning' : 'primary'}
            variant="contained"
            disabled={isApproving}
          >
            {isApproving
              ? 'Approving...'
              : force
                ? 'Force Approve All'
                : 'Approve Eligible'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

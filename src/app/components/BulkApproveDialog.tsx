'use client';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  Typography,
  Alert,
  Box,
} from '@mui/material';
import { useState } from 'react';

interface BulkApproveDialogProps {
  open: boolean;
  onClose: () => void;
}

interface ApprovalResult {
  message: string;
  approvedCount: number;
  needsReviewCount: number;
  processedCount: number;
  skippedOffers?: Array<{
    id: string;
    name: string;
    reason?: string;
  }>;
}

export const BulkApproveDialog = ({ open, onClose }: BulkApproveDialogProps) => {
  const [forceMode, setForceMode] = useState(false);
  const [result, setResult] = useState<ApprovalResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const requestBody = { force: forceMode };
      console.log('Dialog - Sending request with body:', requestBody);
      console.log('Dialog - Force mode type:', typeof forceMode);
      console.log('Dialog - Force mode value:', forceMode);

      const response = await fetch('/api/opportunities/approve/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to approve opportunities');
      }

      const data = await response.json();
      console.log('Dialog - Received response:', data);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    setForceMode(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Bulk Approve Opportunities</DialogTitle>
      <DialogContent>
        {!result && !error && (
          <>
            <Typography gutterBottom>
              This will approve all staged opportunities that don't need review.
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={forceMode}
                  onChange={(e) => setForceMode(e.target.checked)}
                />
              }
              label="Force approve all (including those that need review)"
            />
          </>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Approval Results
            </Typography>
            <Typography>
              Successfully approved {result.approvedCount} opportunities.
            </Typography>
            {result.skippedOffers && result.skippedOffers.length > 0 && (
              <>
                <Typography color="warning.main" sx={{ mt: 2, mb: 1 }}>
                  The following {result.needsReviewCount} opportunities were skipped (need
                  review):
                </Typography>
                <Box
                  sx={{
                    maxHeight: 200,
                    overflowY: 'auto',
                    bgcolor: 'grey.100',
                    p: 2,
                    borderRadius: 1,
                  }}
                >
                  {result.skippedOffers.map((offer) => (
                    <Typography key={offer.id} variant="body2" gutterBottom>
                      • {offer.name}
                      {offer.reason && (
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                        >
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
        <Button onClick={handleClose}>{result || error ? 'Close' : 'Cancel'}</Button>
        {!result && !error && (
          <Button onClick={handleConfirm} variant="contained" disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Confirm'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

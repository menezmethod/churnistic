'use client';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@mui/material';
import { useState } from 'react';

interface MarkForReviewDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  defaultReason?: string;
}

export const MarkForReviewDialog = ({
  open,
  onClose,
  onConfirm,
  defaultReason = '',
}: MarkForReviewDialogProps) => {
  const [reason, setReason] = useState(defaultReason);

  const handleConfirm = () => {
    onConfirm(reason);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Mark for Review</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Please provide a reason why this opportunity needs review. This will help with
          future AI-based validation.
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          label="Review Reason"
          fullWidth
          variant="outlined"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g., Potentially expired, Data discrepancy"
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleConfirm} variant="contained" disabled={!reason.trim()}>
          Mark for Review
        </Button>
      </DialogActions>
    </Dialog>
  );
};

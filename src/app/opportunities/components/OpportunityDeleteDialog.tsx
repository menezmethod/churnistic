'use client';

import { Warning as WarningIcon } from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material';
import { useState } from 'react';

interface OpportunityDeleteDialogProps {
  open: boolean;
  opportunity?: { id?: string; name?: string };
  onCancelAction: () => void;
  onConfirmAction: () => void;
}

export default function OpportunityDeleteDialog({
  open,
  opportunity,
  onCancelAction,
  onConfirmAction,
}: OpportunityDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirmAction();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onCancelAction} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="error" />
        Confirm Deletion
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete <strong>{opportunity?.name}</strong>? This
          action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancelAction} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          color="error"
          variant="contained"
          disabled={isDeleting}
        >
          {isDeleting ? <CircularProgress size={20} /> : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

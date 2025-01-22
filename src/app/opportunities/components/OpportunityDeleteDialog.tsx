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
  Alert,
} from '@mui/material';
import { useState } from 'react';

import { FirestoreOpportunity } from '@/types/opportunity';

interface OpportunityDeleteDialogProps {
  open: boolean;
  onCancelAction: () => void;
  opportunity: FirestoreOpportunity | null;
  loading?: boolean;
  onConfirm: () => Promise<void>;
}

export default function OpportunityDeleteDialog({
  open,
  onCancelAction,
  opportunity,
  loading = false,
  onConfirm,
}: OpportunityDeleteDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete opportunity');
    }
  };

  if (!opportunity) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancelAction}
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="delete-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="error" />
        Delete Opportunity
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <DialogContentText id="delete-dialog-description">
          Are you sure you want to delete the opportunity &quot;{opportunity.name}&quot;? This action
          cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancelAction} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={loading}
          color="error"
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

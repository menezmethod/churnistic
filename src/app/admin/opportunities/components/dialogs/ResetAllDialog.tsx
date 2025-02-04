'use client';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
} from '@mui/material';

interface ResetAllDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isResetting: boolean;
}

export const ResetAllDialog = ({
  open,
  onClose,
  onConfirm,
  isResetting,
}: ResetAllDialogProps) => {
  return (
    <Dialog open={open} onClose={isResetting ? undefined : onClose}>
      <DialogTitle>Reset All Opportunities</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to reset all opportunities? This will delete all approved
          and rejected opportunities. This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isResetting}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={isResetting}
          startIcon={isResetting ? <CircularProgress size={20} /> : undefined}
        >
          {isResetting ? 'Resetting...' : 'Reset All'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

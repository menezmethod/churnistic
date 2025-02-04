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

interface ResetStagedDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isResetting: boolean;
}

export const ResetStagedDialog = ({
  open,
  onClose,
  onConfirm,
  isResetting,
}: ResetStagedDialogProps) => {
  return (
    <Dialog open={open} onClose={isResetting ? undefined : onClose}>
      <DialogTitle>Reset Staged Offers</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to reset all staged offers? This action cannot be undone.
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
          {isResetting ? 'Resetting...' : 'Reset Staged'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

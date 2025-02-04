'use client';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

interface ResetStagedDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetStagedDialog = ({
  open,
  onClose,
  onConfirm,
}: ResetStagedDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Reset Staged Offers</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to reset all staged offers? This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Reset Staged
        </Button>
      </DialogActions>
    </Dialog>
  );
};

'use client';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

interface ResetAllDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ResetAllDialog = ({ open, onClose, onConfirm }: ResetAllDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Reset All Opportunities</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to reset all opportunities? This will delete all approved
          and rejected opportunities. This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Reset All
        </Button>
      </DialogActions>
    </Dialog>
  );
};

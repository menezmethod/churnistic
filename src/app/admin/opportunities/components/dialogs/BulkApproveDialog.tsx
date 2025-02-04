'use client';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

interface BulkApproveDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const BulkApproveDialog = ({
  open,
  onClose,
  onConfirm,
}: BulkApproveDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Approve All Staged Opportunities</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to approve all staged opportunities? This will process all
          pending opportunities in the system.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} color="success" variant="contained">
          Approve All
        </Button>
      </DialogActions>
    </Dialog>
  );
};

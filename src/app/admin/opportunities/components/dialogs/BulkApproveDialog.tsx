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
} from '@mui/material';
import { useState } from 'react';

interface BulkApproveDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (force: boolean) => void;
}

export const BulkApproveDialog = ({
  open,
  onClose,
  onConfirm,
}: BulkApproveDialogProps) => {
  const [force, setForce] = useState(false);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Approve All Staged Opportunities</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to approve all staged opportunities? This will process all
          pending opportunities in the system.
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={() => onConfirm(force)}
          color={force ? 'warning' : 'success'}
          variant="contained"
        >
          {force ? 'Force Approve All' : 'Approve Eligible'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

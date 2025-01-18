import { Warning as WarningIcon } from '@mui/icons-material';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  alpha,
  useTheme,
} from '@mui/material';

interface DeleteDialogProps {
  open: boolean;
  opportunityId: string;
  opportunityName: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export const DeleteDialog = ({
  open,
  opportunityId,
  opportunityName,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteDialogProps) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      PaperProps={{
        sx: {
          minWidth: { xs: '90%', sm: '400px' },
          maxWidth: '500px',
          p: 1,
          borderRadius: 2,
          background: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(10px)',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: theme.palette.error.main,
        }}
      >
        <WarningIcon color="error" />
        Confirm Deletion
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete <strong>{opportunityName}</strong>? This action
          cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onCancel}
          variant="outlined"
          sx={{
            borderColor: alpha(theme.palette.text.primary, 0.23),
            color: theme.palette.text.primary,
            '&:hover': {
              borderColor: alpha(theme.palette.text.primary, 0.33),
              background: alpha(theme.palette.text.primary, 0.05),
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={() => onConfirm(opportunityId)}
          variant="contained"
          color="error"
          disabled={isDeleting}
          sx={{
            ml: 1,
            position: 'relative',
            minWidth: '100px',
          }}
        >
          {isDeleting ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

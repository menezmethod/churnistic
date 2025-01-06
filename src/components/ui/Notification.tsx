import { Alert, AlertColor, Snackbar } from '@mui/material';

export interface NotificationProps {
  open: boolean;
  message: string;
  severity?: AlertColor;
  onClose: () => void;
  autoHideDuration?: number;
}

export function Notification({
  open,
  message,
  severity = 'info',
  onClose,
  autoHideDuration = 6000,
}: NotificationProps) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{ width: '100%' }}
        elevation={6}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}

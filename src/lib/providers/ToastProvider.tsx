'use client';

import { Alert, AlertColor, Snackbar } from '@mui/material';
import { createContext, useCallback, useContext, useState } from 'react';

interface Toast {
  message: string;
  severity?: AlertColor;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Toast) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback(
    ({ message, severity = 'info', duration = 6000 }: Toast) => {
      setToast({ message, severity, duration });
      setOpen(true);
    },
    []
  );

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Snackbar
          open={open}
          autoHideDuration={toast.duration}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleClose}
            severity={toast.severity}
            variant="filled"
            sx={{
              width: '100%',
              borderRadius: 2,
              boxShadow: (theme) =>
                theme.palette.mode === 'light'
                  ? '0px 8px 24px -4px rgba(16, 24, 40, 0.1), 0px 16px 32px -4px rgba(16, 24, 40, 0.08)'
                  : '0px 8px 16px -4px rgba(0, 0, 0, 0.3)',
            }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

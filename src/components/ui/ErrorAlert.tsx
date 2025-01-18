'use client';

import { Alert, AlertTitle } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface ErrorAlertProps {
  error: Error | unknown;
  title?: string;
}

export default function ErrorAlert({ error, title = 'Error' }: ErrorAlertProps) {
  const theme = useTheme();

  const errorMessage =
    error instanceof Error ? error.message : 'An unknown error occurred';

  return (
    <Alert
      severity="error"
      sx={{
        mb: 3,
        borderRadius: 2,
        boxShadow: theme.shadows[1],
        border: '1px solid',
        borderColor: theme.palette.error.main,
        backdropFilter: 'blur(8px)',
        '& .MuiAlert-icon': {
          fontSize: '2rem',
        },
      }}
    >
      <AlertTitle sx={{ fontSize: '1.2rem' }}>{title}</AlertTitle>
      {errorMessage}
    </Alert>
  );
}

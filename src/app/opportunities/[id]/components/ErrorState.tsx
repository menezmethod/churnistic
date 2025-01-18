import { ArrowBack } from '@mui/icons-material';
import { Alert, AlertTitle, Button, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface ErrorStateProps {
  error: Error;
  onRetry?: () => void;
}

export const ErrorState = ({ error, onRetry }: ErrorStateProps) => {
  return (
    <>
      <Link href="/opportunities" style={{ textDecoration: 'none' }}>
        <Button
          startIcon={<ArrowBack />}
          variant="outlined"
          sx={{
            mb: 3,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': {
              transform: 'translateX(-4px)',
            },
          }}
        >
          Back to Opportunities
        </Button>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Alert
          severity="error"
          sx={{
            borderRadius: 2,
            boxShadow: (theme) => theme.shadows[1],
            border: '1px solid',
            borderColor: (theme) => alpha(theme.palette.error.main, 0.2),
            backdropFilter: 'blur(8px)',
            '& .MuiAlert-icon': {
              fontSize: '2rem',
            },
          }}
        >
          <AlertTitle sx={{ fontSize: '1.2rem' }}>Error Loading Opportunity</AlertTitle>
          {error.message}
        </Alert>

        {onRetry && (
          <Button
            variant="contained"
            onClick={onRetry}
            sx={{
              mt: 2,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Retry
          </Button>
        )}
      </motion.div>
    </>
  );
};

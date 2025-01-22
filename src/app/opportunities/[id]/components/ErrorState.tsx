import { ArrowBack, Refresh } from '@mui/icons-material';
import { Alert, AlertTitle, Button, Box, alpha } from '@mui/material';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface ErrorStateProps {
  error: Error;
  onRetry?: () => void;
}

export const ErrorState = ({ error, onRetry }: ErrorStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Link
          href="/opportunities"
          style={{ textDecoration: 'none', alignSelf: 'flex-start' }}
        >
          <Button
            startIcon={<ArrowBack />}
            variant="outlined"
            sx={{
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
          <AlertTitle sx={{ fontSize: '1.2rem', fontWeight: 600 }}>
            Error Loading Opportunity
          </AlertTitle>
          {error.message}
          {onRetry && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="error"
                startIcon={<Refresh />}
                onClick={onRetry}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    transform: 'scale(1.02)',
                  },
                }}
              >
                Try Again
              </Button>
            </Box>
          )}
        </Alert>
      </Box>
    </motion.div>
  );
};

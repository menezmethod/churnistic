import { Box, Paper, Skeleton } from '@mui/material';

export default function ProgressCardSkeleton() {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        background: 'transparent',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: 4,
          background: 'divider',
          opacity: 0.5,
        },
      }}
    >
      <Box display="flex" alignItems="center" gap={2}>
        {/* Icon skeleton */}
        <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: 2 }} />

        <Box flex={1}>
          {/* Title skeleton */}
          <Skeleton variant="text" width={180} sx={{ fontSize: '0.875rem', mb: 1 }} />

          {/* Progress bar skeleton */}
          <Skeleton variant="rounded" width="100%" height={6} sx={{ mb: 1 }} />

          {/* Progress text skeleton */}
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Skeleton variant="text" width={60} sx={{ fontSize: '0.75rem' }} />
            <Skeleton variant="text" width={60} sx={{ fontSize: '0.75rem' }} />
          </Box>

          {/* Chips skeleton */}
          <Box display="flex" alignItems="center" gap={1}>
            <Skeleton variant="rounded" width={100} height={24} />
            <Skeleton variant="circular" width={28} height={28} />
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

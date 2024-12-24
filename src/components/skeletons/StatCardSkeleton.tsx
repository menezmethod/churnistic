import { Box, Paper, Skeleton } from '@mui/material';

export default function StatCardSkeleton() {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        background: 'transparent',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ width: '100%' }}>
          {/* Icon and title */}
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Skeleton variant="circular" width={24} height={24} />
            <Skeleton variant="text" width={100} sx={{ fontSize: '0.75rem' }} />
          </Box>

          {/* Value */}
          <Skeleton
            variant="text"
            width={120}
            sx={{
              fontSize: '2rem',
              mb: 1,
            }}
          />

          {/* Trend */}
          <Box display="flex" alignItems="center" gap={1}>
            <Skeleton variant="rounded" width={60} height={28} />
            <Skeleton variant="text" width={80} sx={{ fontSize: '0.875rem' }} />
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

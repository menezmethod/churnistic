import { Box, Paper, Skeleton } from '@mui/material';

export default function OpportunityCardSkeleton() {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        background: 'transparent',
      }}
    >
      <Box display="flex" alignItems="center" gap={2}>
        {/* Icon skeleton */}
        <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: 2 }} />

        <Box flex={1}>
          {/* Title skeleton */}
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <Skeleton variant="text" width={200} sx={{ fontSize: '1rem' }} />
          </Box>

          {/* Chips skeleton */}
          <Box display="flex" alignItems="center" gap={1}>
            <Skeleton variant="rounded" width={80} height={24} />
            <Skeleton variant="rounded" width={120} height={24} />
          </Box>
        </Box>

        {/* Value skeleton */}
        <Box textAlign="right">
          <Skeleton variant="text" width={80} sx={{ fontSize: '1.5rem', mb: 1 }} />
          <Skeleton variant="circular" width={32} height={32} />
        </Box>
      </Box>
    </Paper>
  );
}

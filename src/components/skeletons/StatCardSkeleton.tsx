'use client';

import { Skeleton } from '@mui/material';

export default function StatCardSkeleton() {
  return (
    <Skeleton variant="rectangular" width="100%" height={118} sx={{ borderRadius: 2 }} />
  );
}

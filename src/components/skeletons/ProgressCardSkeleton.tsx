'use client';

import { Skeleton } from '@mui/material';

export default function ProgressCardSkeleton() {
  return (
    <Skeleton
      variant="rectangular"
      width="100%"
      height={120}
      sx={{ borderRadius: 2, mb: 2 }}
    />
  );
}

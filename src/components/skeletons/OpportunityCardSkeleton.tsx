'use client';

import { Skeleton } from '@mui/material';

export default function OpportunityCardSkeleton() {
  return (
    <Skeleton
      variant="rectangular"
      width="100%"
      height={96}
      sx={{ borderRadius: 2, mb: 2 }}
    />
  );
}

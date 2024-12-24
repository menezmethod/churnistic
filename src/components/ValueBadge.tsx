'use client';

import { Box, Typography, useTheme } from '@mui/material';
import { ReactNode } from 'react';

interface ValueBadgeProps {
  icon?: ReactNode;
  label: string;
  value: string;
}

export const ValueBadge = ({ icon, label, value }: ValueBadgeProps) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1.5,
        borderRadius: 2,
        bgcolor:
          theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(0, 0, 0, 0.05)',
        border: '1px solid',
        borderColor:
          theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.1)',
      }}
    >
      {icon && (
        <Box
          sx={{
            color: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {icon}
        </Box>
      )}
      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', fontWeight: 500 }}
        >
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
};

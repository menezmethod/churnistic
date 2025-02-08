'use client';

import { Stack, Typography, alpha, useTheme, Paper } from '@mui/material';

interface OpportunityStatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  prefix?: string;
  suffix?: string;
}

export const OpportunityStatsCard = ({
  title,
  value,
  icon,
  prefix = '',
  suffix = '',
}: OpportunityStatsCardProps) => {
  const theme = useTheme();
  const formattedValue = title === 'Processing Rate' ? `${value}` : value;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        height: '100%',
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center">
          {icon}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
          >
            {title}
          </Typography>
        </Stack>
        <Typography
          variant="h5"
          fontWeight="500"
          sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
        >
          {prefix}
          {formattedValue}
          {suffix}
        </Typography>
      </Stack>
    </Paper>
  );
};

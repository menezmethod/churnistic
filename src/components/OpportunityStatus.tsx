'use client';

import { Box, Typography, useTheme } from '@mui/material';

interface OpportunityStatusProps {
  status: string;
}

export const OpportunityStatus = ({ status }: OpportunityStatusProps) => {
  const theme = useTheme();
  const isActive = status.toLowerCase() === 'active';

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        bgcolor: isActive ? theme.palette.success.main : theme.palette.warning.main,
        opacity: 0.1,
        border: '1px solid',
        borderColor: isActive ? theme.palette.success.main : theme.palette.warning.main,
      }}
    >
      <Typography
        variant="body2"
        color={isActive ? 'success.main' : 'warning.main'}
        sx={{ textTransform: 'capitalize', fontWeight: 500 }}
      >
        {status}
      </Typography>
    </Box>
  );
};

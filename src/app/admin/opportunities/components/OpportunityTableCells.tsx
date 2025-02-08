'use client';

import { Box, Chip, Stack, Typography, alpha, useTheme } from '@mui/material';

interface InstitutionCellProps {
  name: string;
  description?: string;
  logo?: {
    url: string;
  };
}

export const InstitutionCell = ({ name, description, logo }: InstitutionCellProps) => {
  const theme = useTheme();

  return (
    <Stack direction="row" alignItems="center" spacing={2}>
      {logo && (
        <Box
          component="img"
          src={logo.url}
          alt={name}
          sx={{
            width: 32,
            height: 32,
            objectFit: 'contain',
            borderRadius: 1,
            p: 0.5,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            bgcolor: 'background.paper',
          }}
        />
      )}
      <Box>
        <Typography fontWeight="medium">{name}</Typography>
        {description && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {description}
          </Typography>
        )}
      </Box>
    </Stack>
  );
};

interface TypeCellProps {
  type: 'bank' | 'credit_card' | 'brokerage';
}

export const TypeCell = ({ type }: TypeCellProps) => (
  <Chip
    label={type}
    size="small"
    color={type === 'bank' ? 'success' : type === 'credit_card' ? 'info' : 'warning'}
    sx={{
      fontWeight: 500,
      '& .MuiChip-label': { px: 2 },
      textTransform: 'capitalize',
    }}
  />
);

interface ValueCellProps {
  value: number;
  spendRequirement?: number;
}

export const ValueCell = ({ value, spendRequirement }: ValueCellProps) => (
  <Stack spacing={0.5}>
    <Typography color="success.main" fontWeight="bold">
      ${value}
    </Typography>
    {spendRequirement && (
      <Typography variant="caption" color="text.secondary">
        Min. Spend: ${spendRequirement}
      </Typography>
    )}
  </Stack>
);

interface ExpiryCellProps {
  expiration?: string;
  bonusPostingTime?: string;
}

export const ExpiryCell = ({ expiration, bonusPostingTime }: ExpiryCellProps) => {
  if (!expiration && !bonusPostingTime) return '-';

  const date = new Date(expiration || bonusPostingTime || '');
  if (isNaN(date.getTime())) return '-';

  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" fontWeight="medium">
        {date.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </Typography>
      {bonusPostingTime && (
        <Typography variant="caption" color="text.secondary">
          Posts: {bonusPostingTime}
        </Typography>
      )}
    </Stack>
  );
};

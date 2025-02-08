'use client';

import { ExpandMore as ExpandIcon } from '@mui/icons-material';
import {
  Box,
  IconButton,
  Stack,
  Typography,
  alpha,
  useTheme,
  CircularProgress,
} from '@mui/material';
import { ReactNode } from 'react';

interface OpportunitySectionProps {
  title: string;
  subtitle?: string;
  count: number;
  icon: ReactNode;
  iconColor: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  flex?: boolean;
  isLoading?: boolean;
}

export const OpportunitySection = ({
  title,
  subtitle,
  count,
  icon,
  iconColor,
  expanded,
  onToggle,
  children,
  flex,
  isLoading = false,
}: OpportunitySectionProps) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        overflow: 'hidden',
        display: flex ? 'flex' : 'block',
        flexDirection: 'column',
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderBottom: expanded ? `1px solid ${theme.palette.divider}` : 'none',
          bgcolor: alpha(theme.palette.background.default, 0.4),
          cursor: 'pointer',
        }}
        onClick={onToggle}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: iconColor,
          }}
        >
          {isLoading ? <CircularProgress size={24} color="inherit" /> : icon}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="baseline" spacing={1}>
            <Typography
              variant="h6"
              sx={{
                fontSize: { xs: '1rem', sm: '1.125rem' },
                fontWeight: 500,
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              }}
            >
              ({count})
            </Typography>
          </Stack>
          {subtitle && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                mt: 0.5,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        <IconButton
          size="small"
          sx={{
            transform: expanded ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        >
          <ExpandIcon />
        </IconButton>
      </Stack>

      {expanded && <Box sx={{ flex: flex ? 1 : 'none' }}>{children}</Box>}
    </Box>
  );
};

'use client';

import { KeyboardArrowDown as KeyboardArrowDownIcon } from '@mui/icons-material';
import {
  Box,
  IconButton,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { ReactNode } from 'react';

interface OpportunitySectionProps {
  title: string;
  count: number;
  icon: ReactNode;
  iconColor: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  flex?: boolean;
}

export const OpportunitySection = ({
  title,
  count,
  icon,
  iconColor,
  expanded,
  onToggle,
  children,
  flex = false,
}: OpportunitySectionProps) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        overflow: 'hidden',
        flex: flex && expanded ? 1 : 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        onClick={onToggle}
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderBottom: expanded ? `1px solid ${theme.palette.divider}` : 'none',
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            bgcolor: alpha(theme.palette.background.paper, 0.9),
          },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
            <Box
              sx={{
                fontSize: { xs: 20, sm: 24 },
                color: iconColor,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {icon}
            </Box>
            <Typography
              variant="h6"
              fontWeight="500"
              sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
            >
              {title} ({count})
            </Typography>
          </Stack>
          <IconButton
            size="small"
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <KeyboardArrowDownIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
          </IconButton>
        </Stack>
      </Box>
      <Box
        sx={{
          height: expanded ? '100%' : 0,
          overflow: 'hidden',
          transition: 'height 0.3s ease',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {expanded && children}
      </Box>
    </Paper>
  );
};

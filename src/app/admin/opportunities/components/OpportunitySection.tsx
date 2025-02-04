'use client';

import { KeyboardArrowDown as KeyboardArrowDownIcon } from '@mui/icons-material';
import { Box, IconButton, Paper, Typography, alpha, useTheme } from '@mui/material';
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
}

export const OpportunitySection = ({
  title,
  subtitle,
  count,
  icon,
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          <Box>
            <Typography variant="h6" component="h2">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {count} {count === 1 ? 'item' : 'items'}
            </Typography>
            <IconButton
              onClick={onToggle}
              size="small"
              sx={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
            >
              <KeyboardArrowDownIcon />
            </IconButton>
          </Box>
        </Box>
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

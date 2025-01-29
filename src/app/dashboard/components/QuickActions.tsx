'use client';

import {
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { alpha, Box, Button, Typography, useTheme } from '@mui/material';
import Link from 'next/link';
import { motion } from 'framer-motion';

export const QuickActions = () => {
  const theme = useTheme();

  const quickActions = [
    {
      label: 'Add Opportunity',
      description: 'Track a new reward or offer',
      icon: <AddIcon />,
      href: '/opportunities/add',
      color: theme.palette.primary.main,
    },
    {
      label: 'Track Progress',
      description: 'Update your rewards status',
      icon: <TrendingUpIcon />,
      href: '/track',
      color: theme.palette.success.main,
    },
    {
      label: 'Analytics',
      description: 'View detailed insights',
      icon: <AnalyticsIcon />,
      href: '/analytics',
      color: theme.palette.info.main,
    },
    {
      label: 'Settings',
      description: 'Manage preferences',
      icon: <SettingsIcon />,
      href: '/settings',
      color: theme.palette.warning.main,
    },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(4, 1fr)',
        },
        gap: 3,
        mb: 4,
      }}
    >
      {quickActions.map((action, index) => (
        <Button
          key={action.label}
          component={Link}
          href={action.href}
          variant="outlined"
          startIcon={
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: alpha(action.color, 0.08),
                color: action.color,
                transition: 'all 0.3s',
              }}
            >
              {action.icon}
            </Box>
          }
          sx={{
            width: '100%',
            height: '100%',
            justifyContent: 'flex-start',
            py: 2.5,
            px: 2,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            backdropFilter: 'blur(8px)',
            opacity: 0,
            animation: 'slideUp 0.5s forwards',
            animationDelay: `${index * 0.1}s`,
            '@keyframes slideUp': {
              to: {
                opacity: 1,
                transform: 'translateY(0)',
              },
            },
            '&:hover': {
              transform: 'translateY(-4px)',
              bgcolor: alpha(action.color, 0.04),
              borderColor: action.color,
              boxShadow: `0 8px 16px ${alpha(action.color, 0.1)}`,
              '& .MuiButton-startIcon': {
                transform: 'scale(1.1)',
                bgcolor: alpha(action.color, 0.12),
              },
              '& .arrow-icon': {
                transform: 'translateX(4px)',
                opacity: 1,
              },
            },
            '& .MuiButton-startIcon': {
              mr: 2,
              transition: 'all 0.3s',
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <Box sx={{ flex: 1, textAlign: 'left' }}>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              sx={{
                color: 'text.primary',
                transition: 'color 0.3s',
                mb: 0.5,
              }}
            >
              {action.label}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                transition: 'color 0.3s',
              }}
            >
              {action.description}
            </Typography>
          </Box>
          <ArrowForwardIcon
            className="arrow-icon"
            sx={{
              ml: 1,
              opacity: 0,
              transition: 'all 0.3s',
              color: action.color,
            }}
          />
        </Button>
      ))}
    </Box>
  );
};

export default QuickActions;

'use client';

import {
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  InfoOutlined as InfoOutlinedIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { alpha, Box, Button, Typography, useTheme } from '@mui/material';
import { useRouter } from 'next/navigation';

export const QuickActions = () => {
  const theme = useTheme();
  const router = useRouter();

  const quickActions = [
    {
      label: 'Add New Opportunity',
      icon: <AddIcon />,
      onClick: () => router.push('/opportunities/add'),
    },
    {
      label: 'Update Progress',
      icon: <ArrowForwardIcon />,
      onClick: () => console.log('Update progress'),
    },
    {
      label: 'View Analytics',
      icon: <InfoOutlinedIcon />,
      onClick: () => console.log('View analytics'),
    },
    {
      label: 'Settings',
      icon: <SettingsIcon />,
      onClick: () => console.log('Open settings'),
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
        gap: 2,
      }}
    >
      {quickActions.map((action, index) => (
        <Button
          key={action.label}
          variant="outlined"
          startIcon={
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 1,
                bgcolor: alpha(theme.palette.primary.main, 0.08),
                color: 'primary.main',
                transition: 'all 0.3s',
              }}
            >
              {action.icon}
            </Box>
          }
          onClick={action.onClick}
          sx={{
            width: '100%',
            justifyContent: 'flex-start',
            py: 1.5,
            px: 2,
            border: '1px solid',
            borderColor: 'divider',
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
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              borderColor: 'primary.main',
              boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.1)}`,
              '& .MuiButton-startIcon': {
                transform: 'scale(1.1)',
                bgcolor: alpha(theme.palette.primary.main, 0.12),
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
              variant="body2"
              fontWeight={500}
              sx={{
                color: 'text.primary',
                transition: 'color 0.3s',
              }}
            >
              {action.label}
            </Typography>
          </Box>
        </Button>
      ))}
    </Box>
  );
};

export default QuickActions;

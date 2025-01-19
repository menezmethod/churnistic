'use client';

import { alpha, Box, Typography, useTheme } from '@mui/material';

interface WelcomeSectionProps {
  userName: string;
}

export const WelcomeSection = ({ userName }: WelcomeSectionProps) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        mb: 4,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.primary.light, 0.08)})`,
          borderRadius: 2,
          zIndex: -1,
        },
      }}
    >
      <Box
        sx={{
          p: 3,
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
          backdropFilter: 'blur(10px)',
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.3s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[4],
            '&::after': {
              transform: 'rotate(30deg) translateX(0)',
            },
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: -100,
            right: -100,
            width: 200,
            height: 200,
            background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.light, 0.1)})`,
            transform: 'rotate(30deg) translateX(100%)',
            transition: 'transform 0.5s ease-out',
            zIndex: -1,
          },
        }}
      >
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            mb: 1,
            color: 'text.primary',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              left: 0,
              bottom: -4,
              width: '40%',
              height: 3,
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, transparent)`,
              borderRadius: 1,
            },
            opacity: 0,
            animation: 'fadeSlideIn 0.5s forwards',
            '@keyframes fadeSlideIn': {
              to: {
                opacity: 1,
                transform: 'translateY(0)',
              },
            },
          }}
        >
          Welcome {userName.split(' ')[0]}
        </Typography>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 400,
            color: 'text.secondary',
            opacity: 0,
            animation: 'fadeSlideIn 0.5s forwards 0.2s',
          }}
        >
          Your churning journey continues. Let&apos;s maximize those rewards!
        </Typography>
      </Box>
    </Box>
  );
};

export default WelcomeSection;

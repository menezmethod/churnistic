'use client';

import { keyframes } from '@emotion/react';
import {
  MonetizationOn as MonetizationOnIcon,
  ArrowForward as ArrowForwardIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { Box, Paper, Typography, Collapse, Grow } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useState } from 'react';

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

interface StatCardProps {
  icon: typeof MonetizationOnIcon;
  title: string;
  value: string | number;
  trend?: { value: number; label: string };
  color?: 'primary' | 'success' | 'warning' | 'info';
}

export function StatCard({
  icon: Icon,
  title,
  value,
  trend,
  color = 'primary',
}: StatCardProps) {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Grow in={true} timeout={300}>
      <Paper
        elevation={0}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{
          p: 3,
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: '1px solid',
          borderColor: 'divider',
          background: 'transparent',
          animation: isHovered ? `${pulse} 2s infinite` : 'none',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[8],
            '& .stat-icon': {
              transform: 'rotate(0deg) scale(1.2)',
              opacity: 0.4,
            },
            '& .stat-value': {
              transform: 'scale(1.05)',
              color: theme.palette[color].main,
            },
            '&::before': {
              opacity: 0.15,
            },
            '& .stat-details': {
              height: 'auto',
              opacity: 1,
              transform: 'translateY(0)',
            },
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `linear-gradient(135deg, ${theme.palette[color].main}, ${theme.palette[color].light})`,
            opacity: 0.08,
            transition: 'opacity 0.3s',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '200%',
            height: '100%',
            backgroundImage: `linear-gradient(to right, transparent 0%, ${alpha(theme.palette[color].main, 0.1)} 50%, transparent 100%)`,
            animation: isHovered ? `${shimmer} 2s infinite` : 'none',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1, width: '100%' }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Icon
                className="stat-icon"
                sx={{
                  fontSize: '1.5rem',
                  color: `${color}.main`,
                  opacity: 0.7,
                  transition: 'all 0.4s',
                }}
              />
              <Typography
                color="text.secondary"
                sx={{
                  fontWeight: 500,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                }}
              >
                {title}
              </Typography>
            </Box>
            <Typography
              variant="h4"
              className="stat-value"
              sx={{
                mb: 1,
                fontWeight: 700,
                transition: 'all 0.3s',
                background: `linear-gradient(45deg, ${theme.palette[color].main}, ${theme.palette[color].light})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {value}
            </Typography>
            <Collapse in={isHovered}>
              <Box
                className="stat-details"
                sx={{
                  height: 0,
                  opacity: 0,
                  transform: 'translateY(10px)',
                  transition: 'all 0.3s',
                }}
              >
                {trend && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: trend.value >= 0 ? 'success.main' : 'error.main',
                        bgcolor:
                          trend.value >= 0
                            ? alpha(theme.palette.success.main, 0.1)
                            : alpha(theme.palette.error.main, 0.1),
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                      }}
                    >
                      {trend.value >= 0 ? (
                        <ArrowForwardIcon fontSize="small" />
                      ) : (
                        <ExpandLessIcon fontSize="small" />
                      )}
                      <Typography
                        variant="body2"
                        color="inherit"
                        sx={{ ml: 0.5, fontWeight: 600 }}
                      >
                        {Math.abs(trend.value)}%
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontStyle: 'italic' }}
                    >
                      {trend.label}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Collapse>
          </Box>
        </Box>
      </Paper>
    </Grow>
  );
}

import StatCardSkeleton from '@/components/skeletons/StatCardSkeleton';
export { StatCardSkeleton };

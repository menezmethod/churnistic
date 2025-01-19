'use client';

import {
  CreditCard as CreditCardIcon,
  AccountBalance as AccountBalanceIcon,
  Timer as TimerIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Fade,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import Link from 'next/link';

import ProgressCardSkeleton from '@/components/skeletons/ProgressCardSkeleton';

import { TrackedOpportunity } from '../types';

interface ProgressCardProps {
  opportunity: TrackedOpportunity;
}

export function ProgressCard({ opportunity }: ProgressCardProps) {
  const theme = useTheme();
  const progress = (opportunity.progress / opportunity.target) * 100;
  const isUrgent = opportunity.daysLeft <= 15;

  return (
    <Fade in={true}>
      <Paper
        elevation={0}
        component={Link}
        href={`/opportunities/${opportunity.id}`}
        sx={{
          p: 2.5,
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          background: 'transparent',
          textDecoration: 'none',
          '&:hover': {
            transform: 'translateX(4px)',
            boxShadow: theme.shadows[8],
            '& .progress-icon': {
              transform: 'scale(1.1)',
            },
            '& .progress-bar': {
              transform: 'scaleX(1.02)',
            },
            '&::before': {
              opacity: 0.15,
            },
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: 4,
            background: isUrgent
              ? theme.palette.warning.main
              : theme.palette.success.main,
            opacity: 0.5,
            transition: 'opacity 0.3s',
          },
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            className="progress-icon"
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              transition: 'all 0.3s',
            }}
          >
            {opportunity.type === 'credit_card' ? (
              <CreditCardIcon color="primary" />
            ) : (
              <AccountBalanceIcon color="primary" />
            )}
          </Box>
          <Box flex={1}>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              {opportunity.title}
            </Typography>
            <Box mb={1}>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Progress: ${opportunity.progress.toLocaleString()} of $
                  {opportunity.target.toLocaleString()}
                </Typography>
                <Typography
                  variant="caption"
                  color={progress >= 100 ? 'success.main' : 'primary.main'}
                  fontWeight={600}
                >
                  {Math.round(progress)}%
                </Typography>
              </Box>
              <Box position="relative">
                <LinearProgress
                  variant="determinate"
                  value={Math.min(progress, 100)}
                  className="progress-bar"
                  sx={{
                    height: 8,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 1,
                      bgcolor: progress >= 100 ? 'success.main' : 'primary.main',
                      transition: 'all 0.3s',
                    },
                  }}
                />
                {progress >= 100 && (
                  <Box
                    component={motion.div}
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    sx={{
                      position: 'absolute',
                      right: -10,
                      top: -10,
                      color: 'success.main',
                    }}
                  >
                    <CheckCircleIcon />
                  </Box>
                )}
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                icon={<TimerIcon sx={{ fontSize: '1rem !important' }} />}
                label={`${opportunity.daysLeft} days left`}
                size="small"
                color={isUrgent ? 'warning' : 'default'}
                variant="outlined"
                sx={{ fontWeight: 500 }}
              />
              <Tooltip title="Update Progress">
                <IconButton
                  size="small"
                  color="primary"
                  sx={{
                    '&:hover': {
                      transform: 'rotate(180deg)',
                      transition: 'transform 0.5s',
                    },
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Fade>
  );
}

export { ProgressCardSkeleton };

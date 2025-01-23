'use client';

import {
  Timer as TimerIcon,
  ArrowForward as ArrowForwardIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  IconButton,
  Chip,
  Tooltip,
  Fade,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { LogoImage } from '@/app/opportunities/components/LogoImage';
import { getTypeColors } from '@/app/opportunities/utils/colorUtils';
import ProgressCardSkeleton from '@/components/skeletons/ProgressCardSkeleton';

import { TrackedOpportunity } from '../types';

interface ProgressCardProps {
  opportunity: TrackedOpportunity;
}

export function ProgressCard({ opportunity }: ProgressCardProps) {
  const theme = useTheme();
  const colors = getTypeColors(opportunity.type, theme);
  const progress = (opportunity.progress / opportunity.target) * 100;
  const router = useRouter();
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
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[4],
            '& .progress-icon': {
              transform: 'scale(1.1) rotate(5deg)',
            },
            '& .progress-arrow': {
              transform: 'translateX(4px)',
              opacity: 1,
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
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, primary.main, primary.light)',
            opacity: 0.08,
            transition: 'opacity 0.3s',
          },
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            className="progress-icon"
            sx={{
              width: 56,
              height: 56,
              transition: 'all 0.3s',
            }}
          >
            <LogoImage logo={opportunity.logo} name={opportunity.title} colors={colors} />
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
              <LinearProgress
                variant="determinate"
                value={Math.min(progress, 100)}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                  },
                }}
              />
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
          <Box>
            <IconButton
              onClick={() => router.push(`/opportunities/${opportunity.id}`)}
              size="small"
              color="primary"
              aria-label="View opportunity details"
              className="progress-arrow"
              sx={{
                opacity: 0.7,
                transition: 'all 0.3s',
              }}
            >
              <ArrowForwardIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </Fade>
  );
}

export { ProgressCardSkeleton };

'use client';

import {
  CloudDownload as ImportIcon,
  Sync as SyncIcon,
  ExpandMore as ExpandIcon,
  TrendingUp as TrendingUpIcon,
  NewReleases as NewReleasesIcon,
  Speed as SpeedIcon,
  AccessTime as AccessTimeIcon,
  CloudSync as CloudSyncIcon,
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Fade,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { useState } from 'react';

import { useBankRewardsScraper } from '../hooks/useBankRewardsScraper';

export const ScraperControlPanel = () => {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    status,
    stats,
    isRunning,
    progress,
    startScraper,
    stopScraper,
    syncWithFirestore,
    error,
  } = useBankRewardsScraper();

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        background: `linear-gradient(145deg, ${alpha(theme.palette.background.default, 0.8)} 0%, ${alpha(
          theme.palette.background.paper,
          0.9
        )} 100%)`,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        backdropFilter: 'blur(8px)',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: theme.shadows[6],
        },
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{
          p: 2,
          cursor: 'pointer',
          background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(
            theme.palette.primary.main,
            0.05
          )} 100%)`,
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: alpha(
              isRunning ? theme.palette.success.main : theme.palette.info.main,
              0.1
            ),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {isRunning ? (
            <>
              <SyncIcon
                sx={{
                  color: theme.palette.success.main,
                  animation: 'spin 1.5s linear infinite',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              />
              <CircularProgress
                variant="determinate"
                value={progress}
                size={48}
                thickness={2}
                sx={{
                  position: 'absolute',
                  color: alpha(theme.palette.success.main, 0.2),
                  '& .MuiCircularProgress-circle': { strokeLinecap: 'round' },
                }}
              />
            </>
          ) : (
            <ImportIcon sx={{ color: theme.palette.info.main }} />
          )}
        </Box>

        <Box flex={1}>
          <Typography variant="subtitle1" fontWeight="600">
            BankRewards Scraper
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isRunning
              ? `Collecting offers • ${Math.round(progress)}% complete`
              : 'Ready for synchronization'}
          </Typography>
        </Box>

        <IconButton
          size="small"
          sx={{
            transform: `rotate(${isExpanded ? 180 : 0}deg)`,
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <ExpandIcon />
        </IconButton>
      </Stack>

      {/* Content */}
      <Collapse in={isExpanded}>
        <Box sx={{ p: 4, pt: 2 }}>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <StatItem
              label="Total Collected"
              value={stats.totalOffers}
              color={theme.palette.primary.main}
              icon={<TrendingUpIcon fontSize="small" />}
            />
            <StatItem
              label="New Today"
              value={stats.newToday}
              color={theme.palette.success.main}
              icon={<NewReleasesIcon fontSize="small" />}
            />
            <StatItem
              label="Success Rate"
              value={`${stats.successRate}%`}
              color={theme.palette.info.main}
              icon={<SpeedIcon fontSize="small" />}
            />
            <StatItem
              label="Avg. Time"
              value={`${stats.avgTime}s`}
              color={theme.palette.warning.main}
              icon={<AccessTimeIcon fontSize="small" />}
            />
          </Grid>

          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="contained"
              onClick={isRunning ? stopScraper : startScraper}
              disabled={status === 'initializing'}
              startIcon={
                status === 'initializing' ? (
                  <CircularProgress size={20} />
                ) : isRunning ? (
                  <SyncIcon sx={{ animation: 'spin 1.5s linear infinite' }} />
                ) : (
                  <ImportIcon />
                )
              }
              sx={{
                flex: 1,
                py: 1.5,
                borderRadius: 3,
                fontWeight: '600',
                background: isRunning
                  ? `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${alpha(theme.palette.error.dark, 0.8)} 100%)`
                  : undefined,
              }}
            >
              {isRunning ? 'Stop Collection' : 'Begin Harvest'}
            </Button>

            <Button
              variant="outlined"
              onClick={syncWithFirestore}
              disabled={status === 'syncing'}
              startIcon={
                status === 'syncing' ? <CircularProgress size={20} /> : <CloudSyncIcon />
              }
              sx={{
                borderRadius: 3,
                borderWidth: 2,
                '&:hover': { borderWidth: 2 },
              }}
            >
              {status === 'syncing' ? 'Syncing...' : 'Cloud Sync'}
            </Button>
          </Stack>

          {error && (
            <Fade in>
              <Typography
                variant="body2"
                color="error"
                sx={{
                  mt: 2,
                  p: 1.5,
                  borderRadius: 2,
                  background: alpha(theme.palette.error.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                }}
              >
                ⚠️ {error.message}
              </Typography>
            </Fade>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

const StatItem = ({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  color: string;
  icon?: React.ReactNode;
}) => (
  <Grid item xs={6} md={3}>
    <Stack
      direction="row"
      spacing={1.5}
      sx={{
        p: 2,
        borderRadius: 3,
        background: alpha(color, 0.05),
        border: `1px solid ${alpha(color, 0.1)}`,
      }}
    >
      {icon && (
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: alpha(color, 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
      )}
      <Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h6" fontWeight="700" color={color}>
          {value}
        </Typography>
      </Box>
    </Stack>
  </Grid>
);

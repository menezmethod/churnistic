'use client';

import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  LinearProgress,
  Stack,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';

interface SystemStats {
  total_users: number;
  active_users_24h: number;
  total_opportunities: number;
  total_tracked_offers: number;
  system_health: {
    cpu_usage: number;
    memory_usage: number;
    api_latency: number;
  };
}

export default function SuperAdminDashboard() {
  const { data: stats, isLoading } = useQuery<SystemStats>({
    queryKey: ['system-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/system-stats');
      if (!response.ok) {
        throw new Error('Failed to fetch system stats');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading || !stats) {
    return <LinearProgress />;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        System Overview
      </Typography>

      <Grid container spacing={3}>
        {/* User Stats */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Statistics
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Users
                  </Typography>
                  <Typography variant="h4">{stats.total_users}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Active Users (24h)
                  </Typography>
                  <Typography variant="h4">{stats.active_users_24h}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Opportunity Stats */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Opportunity Statistics
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Opportunities
                  </Typography>
                  <Typography variant="h4">{stats.total_opportunities}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tracked Offers
                  </Typography>
                  <Typography variant="h4">{stats.total_tracked_offers}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* System Health */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Health
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    CPU Usage
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={stats.system_health.cpu_usage}
                    color={stats.system_health.cpu_usage > 80 ? 'error' : 'primary'}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                  <Typography variant="caption">
                    {stats.system_health.cpu_usage.toFixed(1)}%
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Memory Usage
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={stats.system_health.memory_usage}
                    color={stats.system_health.memory_usage > 80 ? 'error' : 'primary'}
                    sx={{ height: 10, borderRadius: 5 }}
                  />
                  <Typography variant="caption">
                    {stats.system_health.memory_usage.toFixed(1)}%
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    API Latency
                  </Typography>
                  <Typography>{stats.system_health.api_latency.toFixed(0)}ms</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

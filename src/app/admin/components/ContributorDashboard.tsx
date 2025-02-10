'use client';

import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  LinearProgress,
  Stack,
  Chip,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';

interface ContributorStats {
  opportunities: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  staged_offers: {
    total: number;
    pending_review: number;
    last_24h: number;
  };
}

export default function ContributorDashboard() {
  const { data: stats, isLoading } = useQuery<ContributorStats>({
    queryKey: ['contributor-stats'],
    queryFn: async () => {
      const [
        { count: totalOpportunities },
        { count: pendingOpportunities },
        { count: approvedOpportunities },
        { count: rejectedOpportunities },
        { count: totalStagedOffers },
        { count: pendingStagedOffers },
        { count: recentStagedOffers },
      ] = await Promise.all([
        supabase.from('opportunities').select('*', { count: 'exact', head: true }),
        supabase
          .from('opportunities')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('opportunities')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'approved'),
        supabase
          .from('opportunities')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'rejected'),
        supabase.from('staged_offers').select('*', { count: 'exact', head: true }),
        supabase
          .from('staged_offers')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('staged_offers')
          .select('*', { count: 'exact', head: true })
          .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      ]);

      return {
        opportunities: {
          total: totalOpportunities || 0,
          pending: pendingOpportunities || 0,
          approved: approvedOpportunities || 0,
          rejected: rejectedOpportunities || 0,
        },
        staged_offers: {
          total: totalStagedOffers || 0,
          pending_review: pendingStagedOffers || 0,
          last_24h: recentStagedOffers || 0,
        },
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return <LinearProgress />;
  }

  const approvalRate =
    stats && stats.opportunities.total > 0
      ? (stats.opportunities.approved / stats.opportunities.total) * 100
      : 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Contributor Overview
      </Typography>

      <Grid container spacing={3}>
        {/* Opportunities Stats */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Opportunities
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Opportunities
                  </Typography>
                  <Typography variant="h4">{stats?.opportunities.total}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status Breakdown
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip
                      label={`${stats?.opportunities.pending} Pending`}
                      color="warning"
                      size="small"
                    />
                    <Chip
                      label={`${stats?.opportunities.approved} Approved`}
                      color="success"
                      size="small"
                    />
                    <Chip
                      label={`${stats?.opportunities.rejected} Rejected`}
                      color="error"
                      size="small"
                    />
                  </Stack>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Approval Rate
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={approvalRate}
                    color={
                      approvalRate > 80
                        ? 'success'
                        : approvalRate > 50
                          ? 'warning'
                          : 'error'
                    }
                    sx={{ height: 10, borderRadius: 5, mt: 1 }}
                  />
                  <Typography variant="caption">{approvalRate.toFixed(1)}%</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Staged Offers Stats */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Staged Offers
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Staged Offers
                  </Typography>
                  <Typography variant="h4">{stats?.staged_offers.total}</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Pending Review
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {stats?.staged_offers.pending_review}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    New in Last 24h
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {stats?.staged_offers.last_24h}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

'use client';

import {
  CheckCircle as ApproveIcon,
  TrendingUp as TrendingUpIcon,
  PendingActions as PendingIcon,
  Speed as SpeedIcon,
  AttachMoney as ValueIcon,
} from '@mui/icons-material';
import { Box, Container, Grid, Stack, Typography, useTheme, alpha } from '@mui/material';
import { useState, useCallback, useEffect } from 'react';

import {
  BulkApproveDialog,
  ResetAllDialog,
  ResetStagedDialog,
} from './components/dialogs';
import { DistributionStats } from './components/DistributionStats';
import { OpportunitiesHeader } from './components/OpportunitiesHeader';
import { OpportunityDataGrid } from './components/OpportunityDataGrid';
import { OpportunityPreviewModal } from './components/OpportunityPreviewModal';
import { OpportunitySection } from './components/OpportunitySection';
import { useOpportunities } from './hooks/useOpportunities';
import { ScraperControlPanel } from '../components/ScraperControlPanel';
import { OpportunityStatsCard } from './components/OpportunityStatsCard';
import { SearchSection } from './components/SearchSection';
import { getColumns } from './config/columns';
import { useOpportunityActions } from './hooks/useOpportunityActions';
import { calculateProcessingRate } from './utils';

const OpportunitiesPage = () => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [stagedExpanded, setStagedExpanded] = useState(false);
  const [approvedExpanded, setApprovedExpanded] = useState(false);

  const {
    isLoading,
    pagination,
    setPagination,
    stats,
    importOpportunities,
    hasStagedOpportunities,
    isResettingStagedOffers,
    isResettingOpportunities,
    stagedOpportunities,
    approvedOpportunities,
    queryClient,
    isBulkApproving,
  } = useOpportunities();

  const {
    selectedOpportunity,
    setSelectedOpportunity,
    resetStagedDialogOpen,
    setResetStagedDialogOpen,
    resetAllDialogOpen,
    setResetAllDialogOpen,
    bulkApproveDialogOpen,
    setBulkApproveDialogOpen,
    handleReject,
    handleApprove,
    handleBulkApprove,
    handleResetStaged,
    handleResetAll,
  } = useOpportunityActions();

  useEffect(() => {
    const refetchOnFocus = async () => {
      await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      await queryClient.invalidateQueries({ queryKey: ['opportunities', 'staged'] });
      await queryClient.invalidateQueries({ queryKey: ['opportunities', 'approved'] });
      await queryClient.invalidateQueries({ queryKey: ['opportunities', 'stats'] });
    };

    window.addEventListener('focus', refetchOnFocus);
    return () => {
      window.removeEventListener('focus', refetchOnFocus);
    };
  }, [queryClient]);

  useEffect(() => {
    if (stagedOpportunities.length === 0) {
      setStagedExpanded(false);
    } else {
      setStagedExpanded(true);
    }
  }, [stagedOpportunities.length]);

  useEffect(() => {
    if (stats.approved === 0) {
      setApprovedExpanded(false);
    } else {
      setApprovedExpanded(true);
    }
  }, [stats.approved]);

  const handleSearch = useCallback(
    (value: string) => {
      setSearchTerm(value);
      setPagination({
        ...pagination,
        page: 1,
        filters: { ...pagination.filters, search: value },
      });
    },
    [pagination, setPagination]
  );

  const processingSpeed = calculateProcessingRate(
    stagedOpportunities.length,
    stats.approved
  );

  const stagedColumns = getColumns({
    onPreview: setSelectedOpportunity,
    onApprove: handleApprove,
    onReject: handleReject,
  });

  const approvedColumns = getColumns({
    onPreview: setSelectedOpportunity,
    onReject: handleReject,
    showApprove: false,
    rejectTooltip: 'Move back to staged',
  });

  return (
    <Container
      maxWidth={false}
      sx={{
        py: { xs: 2, sm: 3 },
        px: { xs: 1.5, sm: 2, md: 3 },
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <OpportunitiesHeader
        isLoading={isLoading}
        isBulkApproving={isBulkApproving}
        isResettingStagedOffers={isResettingStagedOffers}
        isResettingOpportunities={isResettingOpportunities}
        hasStagedOpportunities={hasStagedOpportunities}
        stats={stats}
        onImport={importOpportunities}
        onBulkApprove={() => setBulkApproveDialogOpen(true)}
        onResetStaged={() => setResetStagedDialogOpen(true)}
        onResetAll={() => setResetAllDialogOpen(true)}
      />

      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ flex: 1 }}>
        <Grid item xs={12} lg={4}>
          <Stack spacing={{ xs: 2, sm: 3 }}>
            <SearchSection searchTerm={searchTerm} onSearch={handleSearch} />

            <Box sx={{ mx: -1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ p: 1 }}>
                    <OpportunityStatsCard
                      title="Total Opportunities"
                      value={stats.total}
                      icon={
                        <TrendingUpIcon
                          sx={{
                            fontSize: { xs: 20, sm: 24 },
                            color: theme.palette.primary.main,
                          }}
                        />
                      }
                      color={theme.palette.primary.main}
                    />
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 1 }}>
                    <OpportunityStatsCard
                      title="Pending Review"
                      value={stagedOpportunities.length}
                      icon={
                        <PendingIcon
                          sx={{
                            fontSize: { xs: 20, sm: 24 },
                            color: theme.palette.warning.main,
                          }}
                        />
                      }
                      color={theme.palette.warning.main}
                    />
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 1 }}>
                    <OpportunityStatsCard
                      title="Processing Rate"
                      value={Number(processingSpeed)}
                      icon={
                        <SpeedIcon
                          sx={{
                            fontSize: { xs: 20, sm: 24 },
                            color: theme.palette.info.main,
                          }}
                        />
                      }
                      color={theme.palette.info.main}
                      suffix="%"
                    />
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 1 }}>
                    <OpportunityStatsCard
                      title="Avg. Bonus Value"
                      value={stats.avgValue}
                      icon={
                        <ValueIcon
                          sx={{
                            fontSize: { xs: 20, sm: 24 },
                            color: theme.palette.success.main,
                          }}
                        />
                      }
                      color={theme.palette.success.main}
                      prefix="$"
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <DistributionStats stats={stats} />

            <Box
              sx={{
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: alpha(theme.palette.background.paper, 0.6),
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  bgcolor: alpha(theme.palette.background.paper, 0.8),
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight="500"
                  sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                >
                  Scraper Status
                </Typography>
              </Box>
              <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                <ScraperControlPanel />
              </Box>
            </Box>
          </Stack>
        </Grid>

        <Grid item xs={12} lg={8} sx={{ height: '100%' }}>
          <Stack spacing={{ xs: 2, sm: 3 }} sx={{ height: '100%' }}>
            <OpportunitySection
              title="Staged Opportunities"
              count={stagedOpportunities.length}
              icon={<PendingIcon />}
              iconColor={theme.palette.warning.main}
              expanded={stagedExpanded}
              onToggle={() => setStagedExpanded(!stagedExpanded)}
              flex
            >
              <OpportunityDataGrid
                rows={stagedOpportunities}
                columns={stagedColumns}
                loading={isLoading}
                autoHeight={stagedOpportunities.length <= 7}
                getRowClassName={(params) => `opportunity-row-${params.row.status}`}
              />
            </OpportunitySection>

            <OpportunitySection
              title="Approved Opportunities"
              count={approvedOpportunities.length}
              icon={<ApproveIcon />}
              iconColor={theme.palette.success.main}
              expanded={approvedExpanded}
              onToggle={() => setApprovedExpanded(!approvedExpanded)}
              flex
            >
              <OpportunityDataGrid
                rows={approvedOpportunities}
                columns={approvedColumns}
                loading={isLoading}
                autoHeight={approvedOpportunities.length <= 7}
                getRowClassName={(params) => `opportunity-row-${params.row.status}`}
              />
            </OpportunitySection>
          </Stack>
        </Grid>
      </Grid>

      {selectedOpportunity && (
        <OpportunityPreviewModal
          opportunity={selectedOpportunity}
          open={true}
          onClose={() => setSelectedOpportunity(null)}
          onApprove={() => handleApprove(selectedOpportunity)}
          onReject={() => handleReject(selectedOpportunity)}
        />
      )}

      <ResetStagedDialog
        open={resetStagedDialogOpen}
        onClose={() => setResetStagedDialogOpen(false)}
        onConfirm={handleResetStaged}
      />
      <ResetAllDialog
        open={resetAllDialogOpen}
        onClose={() => setResetAllDialogOpen(false)}
        onConfirm={handleResetAll}
      />
      <BulkApproveDialog
        open={bulkApproveDialogOpen}
        onClose={() => setBulkApproveDialogOpen(false)}
        onConfirm={handleBulkApprove}
      />
    </Container>
  );
};

export default OpportunitiesPage;

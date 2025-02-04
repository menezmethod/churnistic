'use client';

import {
  CheckCircle as ApproveIcon,
  TrendingUp as TrendingUpIcon,
  PendingActions as PendingIcon,
  Speed as SpeedIcon,
  AttachMoney as ValueIcon,
  Close as RejectIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { Box, Container, Grid, Stack, useTheme } from '@mui/material';
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
import { Opportunity } from './types/opportunity';
import { calculateProcessingRate } from './utils';

const OpportunitiesPage = () => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [stagedExpanded, setStagedExpanded] = useState(false);
  const [approvedExpanded, setApprovedExpanded] = useState(false);
  const [reviewExpanded, setReviewExpanded] = useState(true);
  const [rejectedExpanded, setRejectedExpanded] = useState(false);

  const {
    isLoading,
    pagination,
    setPagination,
    stats,
    importOpportunities,
    isResettingStagedOffers,
    isResettingOpportunities,
    stagedOpportunities,
    approvedOpportunities,
    rejectedOpportunities,
    queryClient,
    isBulkApproving,
  } = useOpportunities();

  const { needsReviewOffers, regularStagedOffers } = stagedOpportunities.reduce<{
    needsReviewOffers: Array<Opportunity & { isStaged: boolean }>;
    regularStagedOffers: Array<Opportunity & { isStaged: boolean }>;
  }>(
    (acc, opp) => {
      const expiryDate = opp.details?.expiration;
      if (!expiryDate) {
        acc.regularStagedOffers.push(opp);
        return acc;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expiry = new Date(expiryDate);
      expiry.setHours(0, 0, 0, 0);

      const diffDays = Math.ceil(
        (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays < 0) {
        acc.needsReviewOffers.push(opp);
      } else {
        acc.regularStagedOffers.push(opp);
      }

      return acc;
    },
    { needsReviewOffers: [], regularStagedOffers: [] }
  );

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
    // Auto collapse empty sections and expand non-empty ones (except rejected)
    if (regularStagedOffers.length === 0) {
      setStagedExpanded(false);
    } else if (regularStagedOffers.length > 0) {
      setStagedExpanded(true);
    }

    if (needsReviewOffers.length === 0) {
      setReviewExpanded(false);
    } else if (needsReviewOffers.length > 0) {
      setReviewExpanded(true);
    }

    if (approvedOpportunities.length === 0) {
      setApprovedExpanded(false);
    } else if (approvedOpportunities.length > 0) {
      setApprovedExpanded(true);
    }

    // For rejected, only auto-collapse when empty
    if (!rejectedOpportunities?.length) {
      setRejectedExpanded(false);
    }
  }, [
    regularStagedOffers.length,
    needsReviewOffers.length,
    approvedOpportunities.length,
    rejectedOpportunities?.length,
  ]);

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

  const expiredColumns = getColumns({
    onPreview: setSelectedOpportunity,
    onApprove: handleApprove,
    onReject: handleReject,
    showReviewReason: true,
  });

  const rejectedColumns = getColumns({
    onPreview: setSelectedOpportunity,
    onReject: handleReject,
    showApprove: true,
    rejectTooltip: 'Delete permanently',
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
        hasStagedOpportunities={regularStagedOffers.length > 0}
        stats={{
          ...stats,
          staged: regularStagedOffers.length,
          needsReview: needsReviewOffers.length,
        }}
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

            <ScraperControlPanel />
          </Stack>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Stack spacing={{ xs: 2, sm: 3 }}>
            <OpportunitySection
              title="Ready for Review"
              count={regularStagedOffers.length}
              icon={<PendingIcon />}
              iconColor={theme.palette.info.main}
              expanded={stagedExpanded}
              onToggle={() => setStagedExpanded(!stagedExpanded)}
              flex
            >
              <Box sx={{ p: { xs: 1.5, sm: 2 }, flex: 1 }}>
                <OpportunityDataGrid
                  rows={regularStagedOffers}
                  columns={stagedColumns}
                  loading={isLoading}
                  autoHeight={regularStagedOffers.length <= 7}
                  getRowClassName={(params) => `opportunity-row-${params.row.status}`}
                  disableColumnMenu
                  disableColumnFilter
                  disableColumnSelector
                  disableDensitySelector
                  hideFooterSelectedRowCount
                />
              </Box>
            </OpportunitySection>

            <OpportunitySection
              title="Needs Attention"
              subtitle="These offers require additional review before approval"
              count={needsReviewOffers.length}
              icon={<WarningIcon />}
              iconColor={theme.palette.warning.main}
              expanded={reviewExpanded}
              onToggle={() => setReviewExpanded(!reviewExpanded)}
              flex
            >
              <Box sx={{ p: { xs: 1.5, sm: 2 }, flex: 1 }}>
                <OpportunityDataGrid
                  rows={needsReviewOffers}
                  columns={expiredColumns}
                  loading={isLoading}
                  autoHeight={needsReviewOffers.length <= 7}
                  getRowClassName={(params) => `opportunity-row-${params.row.status}`}
                  disableColumnMenu
                  disableColumnFilter
                  disableColumnSelector
                  disableDensitySelector
                  hideFooterSelectedRowCount
                />
              </Box>
            </OpportunitySection>

            <OpportunitySection
              title="Approved"
              count={approvedOpportunities.length}
              icon={<ApproveIcon />}
              iconColor={theme.palette.success.main}
              expanded={approvedExpanded}
              onToggle={() => setApprovedExpanded(!approvedExpanded)}
              flex
            >
              <Box sx={{ p: { xs: 1.5, sm: 2 }, flex: 1 }}>
                <OpportunityDataGrid
                  rows={approvedOpportunities}
                  columns={approvedColumns}
                  loading={isLoading}
                  autoHeight={approvedOpportunities.length <= 7}
                  getRowClassName={(params) => `opportunity-row-${params.row.status}`}
                  disableColumnMenu
                  disableColumnFilter
                  disableColumnSelector
                  disableDensitySelector
                  hideFooterSelectedRowCount
                />
              </Box>
            </OpportunitySection>

            <OpportunitySection
              title="Rejected"
              count={rejectedOpportunities?.length || 0}
              icon={<RejectIcon />}
              iconColor={theme.palette.error.main}
              expanded={rejectedExpanded}
              onToggle={() => setRejectedExpanded(!rejectedExpanded)}
              flex
            >
              <Box sx={{ p: { xs: 1.5, sm: 2 }, flex: 1 }}>
                <OpportunityDataGrid
                  rows={rejectedOpportunities || []}
                  columns={rejectedColumns}
                  loading={isLoading}
                  autoHeight={(rejectedOpportunities?.length || 0) <= 7}
                  getRowClassName={(params) => `opportunity-row-${params.row.status}`}
                  disableColumnMenu
                  disableColumnFilter
                  disableColumnSelector
                  disableDensitySelector
                  hideFooterSelectedRowCount
                />
              </Box>
            </OpportunitySection>
          </Stack>
        </Grid>
      </Grid>

      <OpportunityPreviewModal
        opportunity={selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
        open={selectedOpportunity !== null}
      />

      <BulkApproveDialog
        open={bulkApproveDialogOpen}
        onClose={() => setBulkApproveDialogOpen(false)}
      />

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
    </Container>
  );
};

export default OpportunitiesPage;

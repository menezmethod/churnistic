'use client';

import { Container, Grid } from '@mui/material';
import { useEffect } from 'react';

import { OpportunitiesTable } from '@/app/admin/opportunities/components/OpportunitiesTable';
import { OpportunityPreviewModal } from '@/app/admin/opportunities/components/OpportunityPreviewModal';
import { ScraperControlPanel } from '@/app/admin/opportunities/components/ScraperControlPanel';
import { SearchBar } from '@/app/admin/opportunities/components/SearchBar';
import { StatsGrid } from '@/app/admin/opportunities/components/StatsCards/StatsGrid';
import { useOpportunities } from '@/app/admin/opportunities/hooks/useOpportunities';
import { useOpportunityActions } from '@/app/admin/opportunities/hooks/useOpportunityActions';
import { useOpportunityFilters } from '@/app/admin/opportunities/hooks/useOpportunityFilters';
import { useOpportunityStats } from '@/app/admin/opportunities/hooks/useOpportunityStats';
import type { OpportunityWithStaged } from '@/app/admin/opportunities/types/opportunity';

const OpportunitiesPage = () => {
  const { opportunities, hasMore, importOpportunities } = useOpportunities();
  const stats = useOpportunityStats(opportunities);
  const { pagination, searchTerm, setSearchTerm, handleSort, handlePageChange } =
    useOpportunityFilters();

  const {
    isImporting,
    isBulkApproving,
    selectedOpportunity,
    bulkApproveOpportunities,
    approveOpportunity,
    rejectOpportunity,
    setSelectedOpportunity,
  } = useOpportunityActions(importOpportunities);

  useEffect(() => {
    // Initial sync
    importOpportunities();

    // Set up interval for continuous sync
    const syncInterval = setInterval(importOpportunities, 5 * 60 * 1000); // Sync every 5 minutes
    return () => clearInterval(syncInterval);
  }, [importOpportunities]);

  const handleBulkApprove = async () => {
    const eligibleOpportunities = opportunities.filter(
      (opp) => opp.isStaged && opp.status !== 'approved' && opp.status !== 'rejected'
    );

    if (eligibleOpportunities.length === 0) return;
    await bulkApproveOpportunities(eligibleOpportunities);
  };

  const canBulkApprove = opportunities.some(
    (opp) => opp.isStaged && opp.status !== 'approved' && opp.status !== 'rejected'
  );

  const handlePreview = (opportunity: OpportunityWithStaged) => {
    setSelectedOpportunity(opportunity);
  };

  const handleApprove = async (opportunity: OpportunityWithStaged) => {
    await approveOpportunity(opportunity);
    if (selectedOpportunity?.id === opportunity.id) {
      setSelectedOpportunity(null);
    }
  };

  const handleReject = async (opportunity: OpportunityWithStaged) => {
    await rejectOpportunity(opportunity);
    if (selectedOpportunity?.id === opportunity.id) {
      setSelectedOpportunity(null);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      <Grid container spacing={3}>
        {/* Stats Grid */}
        <Grid item xs={12}>
          <StatsGrid stats={stats} />
        </Grid>

        {/* Scraper Control Panel */}
        <Grid item xs={12}>
          <ScraperControlPanel />
        </Grid>

        {/* Search and Actions */}
        <Grid item xs={12}>
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSync={importOpportunities}
            onBulkApprove={handleBulkApprove}
            isImporting={isImporting}
            isBulkApproving={isBulkApproving}
            canBulkApprove={canBulkApprove}
          />
        </Grid>

        {/* Opportunities Table */}
        <Grid item xs={12}>
          <OpportunitiesTable
            opportunities={opportunities}
            pagination={pagination}
            hasMore={hasMore}
            onPaginationChange={handlePageChange}
            onSortChange={handleSort}
            onPreview={handlePreview}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </Grid>
      </Grid>

      {/* Preview Modal */}
      {selectedOpportunity && (
        <OpportunityPreviewModal
          opportunity={selectedOpportunity}
          open={true}
          onClose={() => setSelectedOpportunity(null)}
          onApprove={() => handleApprove(selectedOpportunity)}
          onReject={() => handleReject(selectedOpportunity)}
        />
      )}
    </Container>
  );
};

export default OpportunitiesPage;

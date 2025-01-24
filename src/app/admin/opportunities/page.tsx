'use client';

import { Box, Container, Typography } from '@mui/material';
import { useState } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { UserRole } from '@/lib/auth/types';

import AdminProtectedRoute from '../components/AdminProtectedRoute';
import { FilterMenu } from './components/FilterMenu';
import { OpportunitiesTable } from './components/OpportunitiesTable';
import { TableActions } from './components/TableActions';
import { useOpportunities } from './hooks/useOpportunities';

export default function OpportunitiesPage() {
  const { hasRole } = useAuth();
  const [tab, setTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const { opportunities, error, approveOpportunity, rejectOpportunity } =
    useOpportunities();

  // Check if user has admin role (which includes both admin and superadmin)
  const canManageOpportunities = hasRole(UserRole.ADMIN) || hasRole(UserRole.SUPERADMIN);

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const handleFilterSelect = (filter: string) => {
    setActiveFilter(filter);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Filter opportunities based on search query and active filter
  const filteredOpportunities = opportunities.filter((opp) => {
    let matchesSearch = true;
    let matchesFilter = true;

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      matchesSearch =
        opp.name.toLowerCase().includes(searchLower) ||
        opp.bank.toLowerCase().includes(searchLower) ||
        opp.bonus.title.toLowerCase().includes(searchLower);
    }

    if (activeFilter) {
      switch (activeFilter) {
        case 'credit_cards':
          matchesFilter = opp.type === 'credit_card';
          break;
        case 'bank_accounts':
          matchesFilter = opp.type === 'bank';
          break;
        case 'high_value':
          matchesFilter = opp.value >= 500;
          break;
        case 'new_sources':
          matchesFilter =
            new Date(opp.source.collected_at).getTime() >
            Date.now() - 24 * 60 * 60 * 1000;
          break;
        case 'has_warnings':
          matchesFilter = opp.ai_insights.validation_warnings.length > 0;
          break;
      }
    }

    return matchesSearch && matchesFilter;
  });

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ paddingTop: 2, paddingBottom: 2 }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  return (
    <AdminProtectedRoute>
      <Container maxWidth="xl" sx={{ paddingTop: 2, paddingBottom: 2 }}>
        <Box sx={{ width: '100%', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Offer Validation
          </Typography>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <TableActions
              tab={tab}
              pendingCount={
                opportunities.filter((opp) => opp.status === 'pending').length
              }
              onTabChange={setTab}
              onSearch={handleSearch}
              onFilterClick={handleFilterClick}
            />
          </Box>

          <FilterMenu
            anchorEl={anchorEl}
            onClose={handleFilterClose}
            onFilterSelect={handleFilterSelect}
          />

          <OpportunitiesTable
            opportunities={filteredOpportunities}
            canManageOpportunities={canManageOpportunities}
            onApprove={approveOpportunity}
            onReject={rejectOpportunity}
          />
        </Box>
      </Container>
    </AdminProtectedRoute>
  );
}

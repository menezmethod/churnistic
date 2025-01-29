'use client';

import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as BankIcon,
  CreditCard as CardIcon,
  PendingActions as PendingIcon,
  Visibility as PreviewIcon,
  ShowChart as BrokerageIcon,
  AttachMoney as ValueIcon,
  Speed as SpeedIcon,
  CloudDownload as ImportIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useState, useEffect } from 'react';

import { OpportunityPreviewModal } from './components/OpportunityPreviewModal';
import { useOpportunities } from './hooks/useOpportunities';
import { Opportunity } from './types/opportunity';

const StatsCard = ({
  title,
  value,
  icon,
  color,
  suffix,
  prefix,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  suffix?: string;
  prefix?: string;
}) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}20` }}>{icon}</Box>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {prefix && <span>{prefix}</span>}
            {value}
            {suffix && <span>{suffix}</span>}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

const OpportunitiesPage = () => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(
    null
  );
  const {
    opportunities,
    pagination,
    updatePagination,
    hasMore,
    approveOpportunity,
    rejectOpportunity,
    stats,
    importOpportunities,
    isImporting,
  } = useOpportunities();

  useEffect(() => {
    // Initial sync
    importOpportunities();

    // Set up interval for continuous sync
    const syncInterval = setInterval(
      () => {
        importOpportunities();
      },
      5 * 60 * 1000
    ); // Sync every 5 minutes

    return () => clearInterval(syncInterval);
  }, [importOpportunities]);

  const handleSort = (field: string) => {
    updatePagination({
      sortBy: field,
      sortDirection:
        pagination.sortBy === field && pagination.sortDirection === 'asc'
          ? 'desc'
          : 'asc',
    });
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    updatePagination({
      filters: {
        ...pagination.filters,
        search: value || undefined,
      },
    });
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    updatePagination({ page: newPage + 1 });
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    updatePagination({
      pageSize: parseInt(event.target.value, 10),
    });
  };

  const handleSync = async () => {
    try {
      await importOpportunities();
    } catch (error) {
      console.error('Failed to sync opportunities:', error);
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'staged':
        return <Chip label="Staged" color="info" size="small" />;
      case 'pending':
        return <Chip label="Pending" color="warning" size="small" />;
      case 'approved':
        return <Chip label="Approved" color="success" size="small" />;
      case 'rejected':
        return <Chip label="Rejected" color="error" size="small" />;
      default:
        return null;
    }
  };

  const handlePreview = (opportunity: Opportunity & { isStaged?: boolean }) => {
    setSelectedOpportunity(opportunity);
  };

  const handleApprove = async (opportunity: Opportunity & { isStaged?: boolean }) => {
    if (opportunity.isStaged) {
      await approveOpportunity(opportunity);
    } else {
      // Get the full opportunity data for non-staged opportunities
      const fullOpportunity = {
        ...opportunity,
        isStaged: false,
      };
      await approveOpportunity(fullOpportunity);
    }
  };

  const handleReject = async (opportunity: Opportunity & { isStaged?: boolean }) => {
    if (opportunity.isStaged) {
      await rejectOpportunity(opportunity);
    } else {
      // Get the full opportunity data for non-staged opportunities
      const fullOpportunity = {
        ...opportunity,
        isStaged: false,
      };
      await rejectOpportunity(fullOpportunity);
    }
  };

  const processingSpeed =
    stats.total > 0
      ? (((stats.approved + stats.rejected) / stats.total) * 100).toFixed(1)
      : '0';

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Main Stats */}
        <Grid item xs={12} md={3}>
          <StatsCard
            title="Total Opportunities"
            value={stats.total}
            icon={<TrendingUpIcon sx={{ color: theme.palette.primary.main }} />}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatsCard
            title="Pending Review"
            value={stats.pending}
            icon={<PendingIcon sx={{ color: theme.palette.warning.main }} />}
            color={theme.palette.warning.main}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatsCard
            title="Processing Rate"
            value={Number(processingSpeed)}
            icon={<SpeedIcon sx={{ color: theme.palette.info.main }} />}
            color={theme.palette.info.main}
            suffix="%"
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatsCard
            title="Avg. Bonus Value"
            value={stats.avgValue}
            icon={<ValueIcon sx={{ color: theme.palette.success.main }} />}
            color={theme.palette.success.main}
            prefix="$"
          />
        </Grid>

        {/* Offer Type Distribution */}
        <Grid item xs={12} md={3}>
          <StatsCard
            title="Bank Offers"
            value={stats.byType.bank}
            icon={<BankIcon sx={{ color: theme.palette.success.main }} />}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatsCard
            title="Credit Card Offers"
            value={stats.byType.credit_card}
            icon={<CardIcon sx={{ color: theme.palette.info.main }} />}
            color={theme.palette.info.main}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatsCard
            title="Brokerage Offers"
            value={stats.byType.brokerage}
            icon={<BrokerageIcon sx={{ color: theme.palette.secondary.main }} />}
            color={theme.palette.secondary.main}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatsCard
            title="High Value ($500+)"
            value={stats.highValue}
            icon={<ValueIcon sx={{ color: theme.palette.error.main }} />}
            color={theme.palette.error.main}
          />
        </Grid>

        {/* Search and Sync */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                placeholder="Search opportunities..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                startIcon={<ImportIcon />}
                onClick={handleSync}
                disabled={isImporting}
              >
                {isImporting ? 'Syncing...' : 'Sync Now'}
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* Opportunities Table */}
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={pagination.sortBy === 'name'}
                      direction={pagination.sortDirection}
                      onClick={() => handleSort('name')}
                    >
                      Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={pagination.sortBy === 'value'}
                      direction={pagination.sortDirection}
                      onClick={() => handleSort('value')}
                    >
                      Value
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {opportunities
                  .filter(
                    (opp, index, self) =>
                      // Only keep the first occurrence of each ID
                      index === self.findIndex((o) => o.id === opp.id)
                  )
                  .map((opportunity) => (
                    <TableRow
                      key={opportunity.id}
                      hover
                      sx={opportunity.isStaged ? { bgcolor: 'action.hover' } : undefined}
                    >
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          {opportunity.logo && (
                            <Box
                              component="img"
                              src={opportunity.logo.url}
                              alt={opportunity.name}
                              sx={{ width: 24, height: 24, objectFit: 'contain' }}
                            />
                          )}
                          <Typography>{opportunity.name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={opportunity.type}
                          size="small"
                          color={opportunity.type === 'bank' ? 'success' : 'info'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography color="success.main" fontWeight="bold">
                          ${opportunity.value}
                        </Typography>
                      </TableCell>
                      <TableCell>{getStatusChip(opportunity.status)}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() => handlePreview(opportunity)}
                          color="primary"
                        >
                          <PreviewIcon />
                        </IconButton>
                        <IconButton
                          color="success"
                          onClick={() => handleApprove(opportunity)}
                          disabled={
                            opportunity.status === 'approved' ||
                            opportunity.status === 'rejected'
                          }
                        >
                          <ApproveIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleReject(opportunity)}
                          disabled={
                            opportunity.status === 'approved' ||
                            opportunity.status === 'rejected'
                          }
                        >
                          <RejectIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={stats.total || 0}
              page={pagination.page - 1}
              rowsPerPage={pagination.pageSize}
              rowsPerPageOptions={[10, 20, 50]}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              nextIconButtonProps={{
                disabled: !hasMore,
              }}
            />
          </TableContainer>
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

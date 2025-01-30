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
  DoneAll as BulkApproveIcon,
} from '@mui/icons-material';
import {
  Box,
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
  alpha,
  Fade,
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
}) => {
  const theme = useTheme();
  return (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(color, 0.05)} 0%, ${alpha(color, 0.1)} 100%)`,
        borderRadius: 2,
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: alpha(color, 0.15),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{ color: theme.palette.text.primary }}
            >
              {prefix && <span style={{ opacity: 0.7 }}>{prefix}</span>}
              {value.toLocaleString()}
              {suffix && <span style={{ opacity: 0.7 }}>{suffix}</span>}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: theme.palette.text.secondary, mt: 0.5 }}
            >
              {title}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

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
    bulkApproveOpportunities,
    isBulkApproving,
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

  const handleBulkApprove = async () => {
    // Get all staged opportunities that haven't been approved or rejected
    const eligibleOpportunities = opportunities.filter(
      (opp) => opp.isStaged && opp.status !== 'approved' && opp.status !== 'rejected'
    );

    if (eligibleOpportunities.length === 0) {
      return;
    }

    try {
      await bulkApproveOpportunities(eligibleOpportunities);
    } catch (error) {
      console.error('Failed to bulk approve opportunities:', error);
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
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      <Grid container spacing={3}>
        {/* Main Stats */}
        <Grid item xs={12} md={3}>
          <Fade in timeout={300}>
            <div>
              <StatsCard
                title="Total Opportunities"
                value={stats.total}
                icon={
                  <TrendingUpIcon
                    sx={{ color: theme.palette.primary.main, fontSize: 28 }}
                  />
                }
                color={theme.palette.primary.main}
              />
            </div>
          </Fade>
        </Grid>
        <Grid item xs={12} md={3}>
          <Fade in timeout={300}>
            <div>
              <StatsCard
                title="Pending Review"
                value={stats.pending}
                icon={
                  <PendingIcon sx={{ color: theme.palette.warning.main, fontSize: 28 }} />
                }
                color={theme.palette.warning.main}
              />
            </div>
          </Fade>
        </Grid>
        <Grid item xs={12} md={3}>
          <Fade in timeout={300}>
            <div>
              <StatsCard
                title="Processing Rate"
                value={Number(processingSpeed)}
                icon={<SpeedIcon sx={{ color: theme.palette.info.main, fontSize: 28 }} />}
                color={theme.palette.info.main}
                suffix="%"
              />
            </div>
          </Fade>
        </Grid>
        <Grid item xs={12} md={3}>
          <Fade in timeout={300}>
            <div>
              <StatsCard
                title="Avg. Bonus Value"
                value={stats.avgValue}
                icon={
                  <ValueIcon sx={{ color: theme.palette.success.main, fontSize: 28 }} />
                }
                color={theme.palette.success.main}
                prefix="$"
              />
            </div>
          </Fade>
        </Grid>

        {/* Offer Type Distribution */}
        <Grid item xs={12} md={3}>
          <Fade in timeout={300}>
            <div>
              <StatsCard
                title="Bank Offers"
                value={stats.byType.bank}
                icon={
                  <BankIcon sx={{ color: theme.palette.success.main, fontSize: 28 }} />
                }
                color={theme.palette.success.main}
              />
            </div>
          </Fade>
        </Grid>
        <Grid item xs={12} md={3}>
          <Fade in timeout={300}>
            <div>
              <StatsCard
                title="Credit Card Offers"
                value={stats.byType.credit_card}
                icon={<CardIcon sx={{ color: theme.palette.info.main, fontSize: 28 }} />}
                color={theme.palette.info.main}
              />
            </div>
          </Fade>
        </Grid>
        <Grid item xs={12} md={3}>
          <Fade in timeout={300}>
            <div>
              <StatsCard
                title="Brokerage Offers"
                value={stats.byType.brokerage}
                icon={
                  <BrokerageIcon
                    sx={{ color: theme.palette.secondary.main, fontSize: 28 }}
                  />
                }
                color={theme.palette.secondary.main}
              />
            </div>
          </Fade>
        </Grid>
        <Grid item xs={12} md={3}>
          <Fade in timeout={300}>
            <div>
              <StatsCard
                title="High Value ($500+)"
                value={stats.highValue}
                icon={
                  <ValueIcon sx={{ color: theme.palette.error.main, fontSize: 28 }} />
                }
                color={theme.palette.error.main}
              />
            </div>
          </Fade>
        </Grid>

        {/* Search and Actions */}
        <Grid item xs={12}>
          <Paper
            elevation={2}
            sx={{
              p: { xs: 2, md: 3 },
              mb: 3,
              borderRadius: 2,
              background: theme.palette.background.paper,
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              sx={{ width: '100%' }}
            >
              <TextField
                fullWidth
                placeholder="Search opportunities..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.background.default, 0.6),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.background.default, 0.8),
                    },
                  },
                }}
              />
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                sx={{ minWidth: { xs: '100%', md: 'auto' } }}
              >
                <IconButton
                  color="primary"
                  onClick={handleSync}
                  disabled={isImporting}
                  sx={{ borderRadius: 2 }}
                  aria-label={isImporting ? 'Syncing...' : 'Sync Now'}
                >
                  <ImportIcon />
                </IconButton>
                <IconButton
                  color="success"
                  onClick={handleBulkApprove}
                  disabled={
                    isBulkApproving ||
                    !opportunities.some(
                      (opp) =>
                        opp.isStaged &&
                        opp.status !== 'approved' &&
                        opp.status !== 'rejected'
                    )
                  }
                  sx={{ borderRadius: 2 }}
                  aria-label={isBulkApproving ? 'Approving All...' : 'Approve All'}
                >
                  <BulkApproveIcon />
                </IconButton>
              </Stack>
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

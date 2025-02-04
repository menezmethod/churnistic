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
  RestartAlt as ResetIcon,
  DeleteForever as ResetAllIcon,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Tooltip,
} from '@mui/material';
import { useState, useMemo, useCallback } from 'react';

import { OpportunityPreviewModal } from './components/OpportunityPreviewModal';
import { useOpportunities } from './hooks/useOpportunities';
import { Opportunity } from './types/opportunity';
import { ScraperControlPanel } from '../components/ScraperControlPanel';

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
              {(value || 0).toLocaleString()}
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
  const [resetStagedDialogOpen, setResetStagedDialogOpen] = useState(false);
  const [resetAllDialogOpen, setResetAllDialogOpen] = useState(false);
  const [bulkApproveDialogOpen, setBulkApproveDialogOpen] = useState(false);

  const {
    total,
    hasMore,
    isLoading,
    pagination,
    setPagination,
    approveOpportunity,
    rejectOpportunity,
    bulkApproveOpportunities,
    isBulkApproving,
    stats,
    importOpportunities,
    hasStagedOpportunities,
    resetStagedOffers,
    isResettingStagedOffers,
    resetOpportunities,
    isResettingOpportunities,
    paginatedData,
    stagedOpportunities,
  } = useOpportunities();

  // Replace the memoized split with:
  const approvedOpportunities = useMemo(
    () => (paginatedData?.items || []).filter((opp) => opp.status === 'approved'),
    [paginatedData]
  );

  const pendingOpportunities = useMemo(
    () => [
      ...stagedOpportunities,
      ...(paginatedData?.items || []).filter(
        (opp) => opp.status === 'pending' || opp.status === 'staged'
      ),
    ],
    [stagedOpportunities, paginatedData]
  );

  const handlePageChange = (_: unknown, newPage: number) => {
    setPagination({ ...pagination, page: newPage + 1 });
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPagination({
      ...pagination,
      pageSize: parseInt(event.target.value, 10),
      page: 1,
    });
  };

  const handleSearch = useCallback(
    (value: string) => {
      setPagination({
        ...pagination,
        page: 1,
        filters: { ...pagination.filters, search: value },
      });
      setSearchTerm(value);
    },
    [pagination, setPagination]
  );

  const handleSync = async () => {
    try {
      await importOpportunities();
    } catch (error) {
      console.error('Failed to sync opportunities:', error);
    }
  };

  const handleBulkApprove = async () => {
    try {
      await bulkApproveOpportunities();
      setBulkApproveDialogOpen(false);
    } catch (error) {
      console.error('Failed to bulk approve opportunities:', error);
    }
  };

  const getStatusChip = (status: string | undefined) => {
    if (!status) return null;

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

  const processingSpeed = useMemo(() => {
    const totalProcessed = stats.approved + stats.rejected;
    return stats.total > 0 ? ((totalProcessed / stats.total) * 100).toFixed(1) : '0';
  }, [stats]);

  const handleResetStaged = async () => {
    try {
      await resetStagedOffers();
      setResetStagedDialogOpen(false);
    } catch (error) {
      console.error('Failed to reset staged offers:', error);
    }
  };

  const handleResetAll = async () => {
    try {
      await resetOpportunities();
      setResetAllDialogOpen(false);
    } catch (error) {
      console.error('Failed to reset opportunities:', error);
    }
  };

  const ResetStagedDialog = () => (
    <Dialog open={resetStagedDialogOpen} onClose={() => setResetStagedDialogOpen(false)}>
      <DialogTitle>Reset Staged Offers</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to reset all staged offers? This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setResetStagedDialogOpen(false)}>Cancel</Button>
        <Button onClick={handleResetStaged} color="error" variant="contained">
          Reset Staged
        </Button>
      </DialogActions>
    </Dialog>
  );

  const ResetAllDialog = () => (
    <Dialog open={resetAllDialogOpen} onClose={() => setResetAllDialogOpen(false)}>
      <DialogTitle>Reset All Opportunities</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to reset all opportunities? This will delete all approved
          and rejected opportunities. This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setResetAllDialogOpen(false)}>Cancel</Button>
        <Button onClick={handleResetAll} color="error" variant="contained">
          Reset All
        </Button>
      </DialogActions>
    </Dialog>
  );

  const BulkApproveDialog = () => (
    <Dialog open={bulkApproveDialogOpen} onClose={() => setBulkApproveDialogOpen(false)}>
      <DialogTitle>Approve All Staged Opportunities</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to approve all staged opportunities? This will process all
          pending opportunities in the system.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setBulkApproveDialogOpen(false)}>Cancel</Button>
        <Button onClick={handleBulkApprove} color="success" variant="contained">
          Approve All
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      <Grid container spacing={3}>
        {/* Scraper Control Panel */}
        <Grid item xs={12}>
          <ScraperControlPanel />
        </Grid>

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
              alignItems="center"
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
                direction="row"
                spacing={1}
                sx={{
                  minWidth: { xs: '100%', md: 'auto' },
                  justifyContent: { xs: 'space-between', sm: 'flex-end' },
                }}
              >
                <Tooltip title="Import new opportunities" arrow placement="top">
                  <span>
                    <IconButton
                      color="primary"
                      onClick={handleSync}
                      disabled={isLoading}
                      sx={{ borderRadius: 2 }}
                      aria-label={isLoading ? 'Syncing...' : 'Sync Now'}
                    >
                      <ImportIcon />
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip title="Approve all staged" arrow placement="top">
                  <span>
                    <IconButton
                      color="success"
                      onClick={() => setBulkApproveDialogOpen(true)}
                      disabled={isBulkApproving || stats.pending === 0}
                      sx={{ borderRadius: 2 }}
                      aria-label={isBulkApproving ? 'Approving All...' : 'Approve All'}
                    >
                      <BulkApproveIcon />
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip title="Clear all staged" arrow placement="top">
                  <span>
                    <IconButton
                      color="warning"
                      onClick={() => setResetStagedDialogOpen(true)}
                      disabled={isResettingStagedOffers || !hasStagedOpportunities}
                      sx={{ borderRadius: 2 }}
                      aria-label="Reset Staged"
                    >
                      <ResetIcon />
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip title="Delete all opportunities" arrow placement="top">
                  <span>
                    <IconButton
                      color="error"
                      onClick={() => setResetAllDialogOpen(true)}
                      disabled={isResettingOpportunities || stats.total === 0}
                      sx={{ borderRadius: 2 }}
                      aria-label="Reset All"
                    >
                      <ResetAllIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        {/* Non-Approved Opportunities Table */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Pending Opportunities ({pendingOpportunities.length})
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={pagination.sortBy === 'name'}
                      direction={pagination.sortDirection}
                      onClick={() =>
                        setPagination({
                          ...pagination,
                          sortBy: 'name',
                          sortDirection:
                            pagination.sortDirection === 'asc' ? 'desc' : 'asc',
                        })
                      }
                    >
                      Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={pagination.sortBy === 'value'}
                      direction={pagination.sortDirection}
                      onClick={() =>
                        setPagination({
                          ...pagination,
                          sortBy: 'value',
                          sortDirection:
                            pagination.sortDirection === 'asc' ? 'desc' : 'asc',
                        })
                      }
                    >
                      Value
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingOpportunities.map((opportunity) => (
                  <TableRow
                    key={opportunity.id}
                    hover
                    sx={
                      (opportunity as Opportunity & { isStaged?: boolean }).isStaged
                        ? { bgcolor: 'action.hover' }
                        : undefined
                    }
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
                      <Tooltip title="Preview opportunity details" arrow>
                        <span>
                          <IconButton
                            onClick={() => handlePreview(opportunity)}
                            color="primary"
                          >
                            <PreviewIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Approve opportunity" arrow>
                        <span>
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
                        </span>
                      </Tooltip>
                      <Tooltip title="Reject opportunity" arrow>
                        <span>
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
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={total}
              page={pagination.page - 1}
              rowsPerPage={pagination.pageSize}
              rowsPerPageOptions={[10, 20, 50]}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              nextIconButtonProps={{
                disabled: !hasMore,
              }}
            />
          </TableContainer>
        </Grid>

        {/* Approved Opportunities Table */}
        <Grid item xs={12} sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Approved Opportunities ({approvedOpportunities.length})
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={pagination.sortBy === 'name'}
                      direction={pagination.sortDirection}
                      onClick={() =>
                        setPagination({
                          ...pagination,
                          sortBy: 'name',
                          sortDirection:
                            pagination.sortDirection === 'asc' ? 'desc' : 'asc',
                        })
                      }
                    >
                      Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={pagination.sortBy === 'value'}
                      direction={pagination.sortDirection}
                      onClick={() =>
                        setPagination({
                          ...pagination,
                          sortBy: 'value',
                          sortDirection:
                            pagination.sortDirection === 'asc' ? 'desc' : 'asc',
                        })
                      }
                    >
                      Value
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {approvedOpportunities.map((opportunity) => (
                  <TableRow
                    key={opportunity.id}
                    hover
                    sx={
                      (opportunity as Opportunity & { isStaged?: boolean }).isStaged
                        ? { bgcolor: 'action.hover' }
                        : undefined
                    }
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
                      <Tooltip title="Preview opportunity details" arrow>
                        <span>
                          <IconButton
                            onClick={() => handlePreview(opportunity)}
                            color="primary"
                          >
                            <PreviewIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={stats.approved}
              page={0}
              rowsPerPage={pagination.pageSize}
              rowsPerPageOptions={[10, 20, 50]}
              onPageChange={() => console.log('Implement approved pagination')}
              onRowsPerPageChange={handleRowsPerPageChange}
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

      <ResetStagedDialog />
      <ResetAllDialog />
      <BulkApproveDialog />
    </Container>
  );
};

export default OpportunitiesPage;

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
  DeleteSweep as PurgeIcon,
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
} from '@mui/material';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

import { OpportunityPreviewModal } from './components/OpportunityPreviewModal';
import { useOpportunities } from './hooks/useOpportunities';
import { Opportunity } from './types/opportunity';
import AdminProtectedRoute from '../components/AdminProtectedRoute';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { StatsExplanation } from './components/StatsExplanation';

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          height: '100%',
          background: `linear-gradient(135deg, ${alpha(color, 0.02)} 0%, ${alpha(
            color,
            0.08
          )} 100%)`,
          borderRadius: 3,
          border: `1px solid ${alpha(color, 0.1)}`,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 8px 24px ${alpha(color, 0.15)}`,
            border: `1px solid ${alpha(color, 0.2)}`,
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(color, 0.12),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: alpha(color, 0.18),
                },
              }}
            >
              {icon}
            </Box>
            <Box>
              <Typography
                variant="h4"
                fontWeight="700"
                sx={{
                  color: theme.palette.text.primary,
                  letterSpacing: '-0.5px',
                }}
              >
                {prefix && (
                  <span style={{ opacity: 0.7, marginRight: '2px' }}>{prefix}</span>
                )}
                {value.toLocaleString()}
                {suffix && (
                  <span style={{ opacity: 0.7, marginLeft: '2px' }}>{suffix}</span>
                )}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: alpha(theme.palette.text.secondary, 0.8),
                  mt: 0.5,
                  fontWeight: 500,
                }}
              >
                {title}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const OpportunitiesPage = () => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(
    null
  );
  const [showPurgeConfirmation, setShowPurgeConfirmation] = useState(false);
  const {
    opportunities,
    pagination,
    updatePagination,
    approveOpportunity,
    rejectOpportunity,
    bulkApproveOpportunities,
    isBulkApproving,
    stats,
    importOpportunities,
    isImporting,
    purgeAllData,
    isPurging,
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

  const handlePurgeClick = () => {
    setShowPurgeConfirmation(true);
  };

  const handlePurgeConfirm = async () => {
    try {
      await purgeAllData();
      setShowPurgeConfirmation(false);
    } catch (error) {
      console.error('Failed to purge data:', error);
    }
  };

  const handlePurgeCancel = () => {
    setShowPurgeConfirmation(false);
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 5 } }}>
      <StatsExplanation />
      <Grid container spacing={4}>
        {/* Stats Grid */}
        <Grid item xs={12}>
          <Grid container spacing={3}>
            {/* Main Overview */}
            <Grid item xs={12} md={4}>
              <StatsCard
                title="Total Opportunities"
                value={stats.total}
                icon={
                  <TrendingUpIcon
                    sx={{ color: theme.palette.primary.main, fontSize: 32 }}
                  />
                }
                color={theme.palette.primary.main}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatsCard
                title="Pending Review"
                value={stats.pending}
                icon={
                  <PendingIcon sx={{ color: theme.palette.warning.main, fontSize: 28 }} />
                }
                color={theme.palette.warning.main}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatsCard
                title="Processing Rate"
                value={Number(processingSpeed)}
                icon={<SpeedIcon sx={{ color: theme.palette.info.main, fontSize: 28 }} />}
                color={theme.palette.info.main}
                suffix="%"
              />
            </Grid>

            {/* Offer Type Distribution */}
            <Grid item xs={12}>
              <Typography
                variant="h6"
                sx={{ mb: 2, color: theme.palette.text.secondary }}
              >
                Offer Type Distribution
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <StatsCard
                    title="Bank Offers"
                    value={stats.byType.bank}
                    icon={
                      <BankIcon
                        sx={{ color: theme.palette.success.main, fontSize: 28 }}
                      />
                    }
                    color={theme.palette.success.main}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <StatsCard
                    title="Credit Card Offers"
                    value={stats.byType.credit_card}
                    icon={
                      <CardIcon sx={{ color: theme.palette.info.main, fontSize: 28 }} />
                    }
                    color={theme.palette.info.main}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
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
                </Grid>
              </Grid>
            </Grid>

            {/* Value Metrics */}
            <Grid item xs={12}>
              <Typography
                variant="h6"
                sx={{ mb: 2, color: theme.palette.text.secondary }}
              >
                Value Metrics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <StatsCard
                    title="Avg. Bonus Value"
                    value={stats.avgValue}
                    icon={
                      <ValueIcon
                        sx={{ color: theme.palette.success.main, fontSize: 28 }}
                      />
                    }
                    color={theme.palette.success.main}
                    prefix="$"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <StatsCard
                    title="High Value Offers ($500+)"
                    value={stats.highValueCount}
                    icon={
                      <ValueIcon sx={{ color: theme.palette.error.main, fontSize: 28 }} />
                    }
                    color={theme.palette.error.main}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Search and Actions */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 3.5 },
              mb: 4,
              borderRadius: 3,
              background: theme.palette.background.paper,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: `0 4px 24px ${alpha(theme.palette.common.black, 0.04)}`,
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={3}
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
                      <SearchIcon sx={{ color: theme.palette.text.secondary, ml: 1 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2.5,
                    backgroundColor: alpha(theme.palette.background.default, 0.6),
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.background.default, 0.8),
                      boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.04)}`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
                    },
                  },
                }}
              />
              <Stack
                direction="row"
                spacing={2}
                sx={{ minWidth: { xs: '100%', md: 'auto' } }}
              >
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <IconButton
                    color="primary"
                    onClick={handleSync}
                    disabled={isImporting}
                    sx={{
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                      },
                    }}
                    title="Sync Opportunities"
                  >
                    <ImportIcon />
                  </IconButton>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <IconButton
                    color="success"
                    onClick={handleBulkApprove}
                    disabled={isBulkApproving}
                    sx={{
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.success.main, 0.08),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.success.main, 0.12),
                      },
                    }}
                    title="Approve All"
                  >
                    <BulkApproveIcon />
                  </IconButton>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <IconButton
                    color="error"
                    onClick={handlePurgeClick}
                    disabled={isPurging}
                    sx={{
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.error.main, 0.08),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.error.main, 0.12),
                      },
                    }}
                    title="Purge All Data"
                  >
                    <PurgeIcon />
                  </IconButton>
                </motion.div>
              </Stack>
            </Stack>
          </Paper>
        </Grid>

        {/* Opportunities Table */}
        <Grid item xs={12}>
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              boxShadow: `0 4px 24px ${alpha(theme.palette.common.black, 0.04)}`,
              overflow: 'hidden',
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      py: 3,
                      px: 3,
                      background: alpha(theme.palette.background.default, 0.5),
                    }}
                  >
                    <TableSortLabel
                      active={pagination.sortBy === 'name'}
                      direction={pagination.sortDirection}
                      onClick={() => handleSort('name')}
                    >
                      <Typography variant="subtitle2" fontWeight={600}>
                        Name
                      </Typography>
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
                      sx={{
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                        },
                        ...(opportunity.isStaged && {
                          bgcolor: alpha(theme.palette.warning.main, 0.04),
                        }),
                      }}
                    >
                      <TableCell sx={{ py: 2.5, px: 3 }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          {opportunity.logo && (
                            <Box
                              component="img"
                              src={opportunity.logo.url}
                              alt={opportunity.name}
                              sx={{
                                width: 32,
                                height: 32,
                                objectFit: 'contain',
                                borderRadius: 1,
                                p: 0.5,
                                bgcolor: 'white',
                                boxShadow: `0 2px 8px ${alpha(
                                  theme.palette.common.black,
                                  0.04
                                )}`,
                              }}
                            />
                          )}
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{ color: theme.palette.text.primary }}
                          >
                            {opportunity.name}
                          </Typography>
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
              sx={{
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                '.MuiTablePagination-select': {
                  borderRadius: 1,
                  '&:focus': {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  },
                },
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

      {/* Purge Confirmation Dialog */}
      <ConfirmationDialog
        open={showPurgeConfirmation}
        title="Confirm Data Purge"
        message="Are you sure you want to purge all data? This action cannot be undone."
        onConfirm={handlePurgeConfirm}
        onCancel={handlePurgeCancel}
      />
    </Container>
  );
};

export default function WrappedOpportunitiesPage() {
  return (
    <AdminProtectedRoute>
      <OpportunitiesPage />
    </AdminProtectedRoute>
  );
}

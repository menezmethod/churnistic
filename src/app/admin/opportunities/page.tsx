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
  TextField,
  Typography,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { getAuth } from 'firebase/auth';
import { useState, useMemo, useCallback, JSX } from 'react';

import { OpportunityPreviewModal } from './components/OpportunityPreviewModal';
import { useOpportunities } from './hooks/useOpportunities';
import { Opportunity } from './types/opportunity';
import { ScraperControlPanel } from '../components/ScraperControlPanel';

interface PaginatedOpportunities {
  items: Opportunity[];
  total: number;
}

interface PaginationState {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  filters?: {
    status?: 'pending' | 'approved' | 'rejected';
    type?: string;
    minValue?: number;
    maxValue?: number;
    search?: string;
    [key: string]: string | number | undefined;
  };
}

type OpportunityStatus = 'staged' | 'pending' | 'approved' | 'rejected';

interface StatusConfig {
  label: string;
  color: 'info' | 'warning' | 'success' | 'error' | 'default';
  icon: JSX.Element;
}

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

const OpportunitiesTable = ({
  opportunities,
  totalCount,
  pagination,
  onPageChange,
  onRowsPerPageChange,
  onPreview,
  onApprove,
  onReject,
  showApproveButton = true,
  rejectTooltip = 'Reject opportunity',
}: {
  opportunities: Opportunity[];
  totalCount: number;
  pagination: PaginationState;
  onPageChange: (event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPreview: (opportunity: Opportunity) => void;
  onApprove: (opportunity: Opportunity) => void;
  onReject: (opportunity: Opportunity) => void;
  showApproveButton?: boolean;
  rejectTooltip?: string;
}) => {
  const theme = useTheme();

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Institution',
      flex: 1,
      minWidth: 250,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" alignItems="center" spacing={2}>
          {params.row.logo && (
            <Box
              component="img"
              src={params.row.logo.url}
              alt={params.row.name}
              sx={{
                width: 32,
                height: 32,
                objectFit: 'contain',
                borderRadius: 1,
                p: 0.5,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                bgcolor: 'background.paper',
              }}
            />
          )}
          <Box>
            <Typography fontWeight="medium">{params.row.name}</Typography>
            {params.row.description && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block' }}
              >
                {params.row.description}
              </Typography>
            )}
          </Box>
        </Stack>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          color={
            params.value === 'bank'
              ? 'success'
              : params.value === 'credit_card'
                ? 'info'
                : 'warning'
          }
          sx={{
            fontWeight: 500,
            '& .MuiChip-label': { px: 2 },
            textTransform: 'capitalize',
          }}
        />
      ),
    },
    {
      field: 'value',
      headerName: 'Bonus Value',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Stack spacing={0.5}>
          <Typography color="success.main" fontWeight="bold">
            ${params.value}
          </Typography>
          {params.row.spend_requirement && (
            <Typography variant="caption" color="text.secondary">
              Min. Spend: ${params.row.spend_requirement}
            </Typography>
          )}
        </Stack>
      ),
    },
    {
      field: 'expiry',
      headerName: 'Expiry',
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        const expiry =
          params.row.details?.expiration ||
          params.row.metadata?.timing?.bonus_posting_time;
        if (!expiry) return '-';

        const date = new Date(expiry);
        // Check if date is valid
        if (isNaN(date.getTime())) return '-';

        return (
          <Stack spacing={0.5}>
            <Typography variant="caption" fontWeight="medium">
              {date.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Typography>
            {params.row.metadata?.timing?.bonus_posting_time && (
              <Typography variant="caption" color="text.secondary">
                Posts: {params.row.metadata.timing.bonus_posting_time}
              </Typography>
            )}
          </Stack>
        );
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        const status = params.value as OpportunityStatus;
        const statusConfigs: Record<OpportunityStatus, StatusConfig> = {
          staged: {
            label: 'Staged',
            color: 'info',
            icon: <PendingIcon sx={{ fontSize: 16, mr: 0.5 }} />,
          },
          pending: {
            label: 'Pending',
            color: 'warning',
            icon: <PendingIcon sx={{ fontSize: 16, mr: 0.5 }} />,
          },
          approved: {
            label: 'Approved',
            color: 'success',
            icon: <ApproveIcon sx={{ fontSize: 16, mr: 0.5 }} />,
          },
          rejected: {
            label: 'Rejected',
            color: 'error',
            icon: <RejectIcon sx={{ fontSize: 16, mr: 0.5 }} />,
          },
        };

        const statusConfig = statusConfigs[status] || {
          label: status,
          color: 'default',
          icon: null,
        };

        return (
          <Chip
            {...(statusConfig.icon ? { icon: statusConfig.icon } : {})}
            label={statusConfig.label}
            size="small"
            color={statusConfig.color}
            sx={{ fontWeight: 500 }}
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Preview opportunity details" arrow>
            <IconButton
              onClick={() => onPreview(params.row)}
              color="primary"
              size="small"
              sx={{
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              <PreviewIcon />
            </IconButton>
          </Tooltip>

          {showApproveButton && (
            <Tooltip title="Approve opportunity" arrow>
              <IconButton
                onClick={() => onApprove(params.row)}
                color="success"
                size="small"
                sx={{
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                  },
                }}
              >
                <ApproveIcon />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title={rejectTooltip} arrow>
            <IconButton
              onClick={() => onReject(params.row)}
              color="error"
              size="small"
              sx={{
                '&:hover': {
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                },
              }}
            >
              <RejectIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        height: 600,
        width: '100%',
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        '& .MuiDataGrid-root': {
          border: 'none',
          '& .MuiDataGrid-cell:focus': {
            outline: 'none',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.04),
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: alpha(theme.palette.background.default, 0.8),
            borderBottom: `1px solid ${theme.palette.divider}`,
          },
          '& .MuiDataGrid-virtualScroller': {
            backgroundColor: theme.palette.background.paper,
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: `1px solid ${theme.palette.divider}`,
          },
          '& .MuiDataGrid-cell': {
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          },
        },
      }}
    >
      <DataGrid
        rows={opportunities}
        columns={columns}
        rowCount={totalCount}
        pageSizeOptions={[10, 20, 50]}
        paginationModel={{
          page: pagination.page - 1,
          pageSize: pagination.pageSize,
        }}
        paginationMode="server"
        onPaginationModelChange={(model) => {
          onPageChange(null, model.page);
          if (model.pageSize !== pagination.pageSize) {
            onRowsPerPageChange({
              target: {
                value: model.pageSize.toString(),
              },
            } as React.ChangeEvent<HTMLInputElement>);
          }
        }}
        disableRowSelectionOnClick
        getRowId={(row) => row.id}
        loading={false}
        disableColumnMenu
        sx={{
          '& .opportunity-row-staged': {
            bgcolor: alpha(theme.palette.info.main, 0.04),
          },
          '& .opportunity-row-approved': {
            bgcolor: alpha(theme.palette.success.main, 0.04),
          },
        }}
        getRowClassName={(params) => `opportunity-row-${params.row.status}`}
      />
    </Paper>
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
    queryClient,
  } = useOpportunities();

  // Replace the memoized split with:
  const approvedOpportunities = useMemo(
    () => (paginatedData?.items || []).filter((opp) => opp.status === 'approved'),
    [paginatedData]
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
    try {
      if (opportunity.status === 'approved') {
        const auth = getAuth();
        const idToken = await auth.currentUser?.getIdToken(true);

        if (!idToken) {
          throw new Error('No authenticated user found');
        }

        await queryClient.cancelQueries({ queryKey: ['opportunities'] });
        await queryClient.cancelQueries({ queryKey: ['opportunities', 'staged'] });

        // Optimistic update
        const previousApproved = queryClient.getQueryData(['opportunities']);
        const previousStaged = queryClient.getQueryData(['opportunities', 'staged']);

        // Remove from approved list
        if (previousApproved) {
          queryClient.setQueryData(['opportunities'], {
            ...previousApproved,
            items: (previousApproved as PaginatedOpportunities).items.filter(
              (opp) => opp.id !== opportunity.id
            ),
          });
        }

        // Add to staged list
        if (previousStaged) {
          queryClient.setQueryData(
            ['opportunities', 'staged'],
            [...(previousStaged as Opportunity[]), { ...opportunity, status: 'staged' }]
          );
        }

        try {
          const response = await fetch('/api/opportunities/reject', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ id: opportunity.id }),
            credentials: 'include',
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(
              error.details || error.error || 'Failed to reject opportunity'
            );
          }

          // Invalidate queries to ensure data is fresh
          await queryClient.invalidateQueries({ queryKey: ['opportunities'] });
          await queryClient.invalidateQueries({ queryKey: ['opportunities', 'staged'] });
        } catch (error) {
          // Revert optimistic updates on error
          if (previousApproved) {
            queryClient.setQueryData(['opportunities'], previousApproved);
          }
          if (previousStaged) {
            queryClient.setQueryData(['opportunities', 'staged'], previousStaged);
          }
          throw error;
        }
      } else {
        await rejectOpportunity(opportunity);
      }
    } catch (error) {
      console.error('Failed to reject opportunity:', error);
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
    <Container maxWidth={false} sx={{ py: 4, px: { xs: 2, md: 4 } }}>
      <Stack spacing={3}>
        {/* Main Header */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
        >
          <Stack spacing={1}>
            <Typography variant="h4" fontWeight="500" color="text.primary">
              Opportunities
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage and review financial opportunities
            </Typography>
          </Stack>
        </Stack>

        {/* Quick Stats */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Total Opportunities"
              value={stats.total}
              icon={
                <TrendingUpIcon
                  sx={{ fontSize: 20, color: theme.palette.primary.main }}
                />
              }
              color={theme.palette.primary.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Pending Review"
              value={stats.pending}
              icon={
                <PendingIcon sx={{ fontSize: 20, color: theme.palette.warning.main }} />
              }
              color={theme.palette.warning.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Processing Rate"
              value={Number(processingSpeed)}
              icon={<SpeedIcon sx={{ fontSize: 20, color: theme.palette.info.main }} />}
              color={theme.palette.info.main}
              suffix="%"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Avg. Bonus Value"
              value={stats.avgValue}
              icon={
                <ValueIcon sx={{ fontSize: 20, color: theme.palette.success.main }} />
              }
              color={theme.palette.success.main}
              prefix="$"
            />
          </Grid>

          {/* Distribution Stats */}
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Bank Offers"
              value={stats.byType.bank}
              icon={<BankIcon sx={{ fontSize: 20, color: theme.palette.success.main }} />}
              color={theme.palette.success.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Credit Card Offers"
              value={stats.byType.credit_card}
              icon={<CardIcon sx={{ fontSize: 20, color: theme.palette.info.main }} />}
              color={theme.palette.info.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Brokerage Offers"
              value={stats.byType.brokerage}
              icon={
                <BrokerageIcon
                  sx={{ fontSize: 20, color: theme.palette.secondary.main }}
                />
              }
              color={theme.palette.secondary.main}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="High Value ($500+)"
              value={stats.highValue}
              icon={<ValueIcon sx={{ fontSize: 20, color: theme.palette.error.main }} />}
              color={theme.palette.error.main}
            />
          </Grid>
        </Grid>

        {/* Search and Actions Bar */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.background.paper, 0.6),
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              fullWidth
              size="small"
              placeholder="Search opportunities..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      sx={{ fontSize: 20, color: theme.palette.text.secondary }}
                    />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  transition: 'all 0.2s',
                  '&:hover, &.Mui-focused': {
                    bgcolor: 'background.paper',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                },
              }}
            />
            <Stack
              direction="row"
              spacing={1}
              sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
            >
              <Tooltip
                title={isLoading ? 'Importing...' : 'Import new opportunities'}
                arrow
              >
                <span>
                  <IconButton
                    color="primary"
                    onClick={handleSync}
                    disabled={isLoading}
                    sx={{
                      borderRadius: 1,
                      position: 'relative',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      },
                    }}
                  >
                    {isLoading ? (
                      <CircularProgress
                        size={16}
                        sx={{
                          color: theme.palette.primary.main,
                          position: 'absolute',
                        }}
                      />
                    ) : (
                      <ImportIcon sx={{ fontSize: 20 }} />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip
                title={isBulkApproving ? 'Processing...' : 'Approve all staged'}
                arrow
              >
                <span>
                  <IconButton
                    color="success"
                    onClick={() => setBulkApproveDialogOpen(true)}
                    disabled={isBulkApproving || stats.pending === 0}
                    sx={{
                      borderRadius: 1,
                      position: 'relative',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.success.main, 0.08),
                      },
                    }}
                  >
                    {isBulkApproving ? (
                      <CircularProgress
                        size={16}
                        sx={{
                          color: theme.palette.success.main,
                          position: 'absolute',
                        }}
                      />
                    ) : (
                      <BulkApproveIcon sx={{ fontSize: 20 }} />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip
                title={isResettingStagedOffers ? 'Clearing...' : 'Clear staged offers'}
                arrow
              >
                <span>
                  <IconButton
                    color="warning"
                    onClick={() => setResetStagedDialogOpen(true)}
                    disabled={isResettingStagedOffers || !hasStagedOpportunities}
                    sx={{
                      borderRadius: 1,
                      position: 'relative',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.warning.main, 0.08),
                      },
                    }}
                  >
                    {isResettingStagedOffers ? (
                      <CircularProgress
                        size={16}
                        sx={{
                          color: theme.palette.warning.main,
                          position: 'absolute',
                        }}
                      />
                    ) : (
                      <ResetIcon sx={{ fontSize: 20 }} />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip
                title={isResettingOpportunities ? 'Resetting...' : 'Reset all data'}
                arrow
              >
                <span>
                  <IconButton
                    color="error"
                    onClick={() => setResetAllDialogOpen(true)}
                    disabled={isResettingOpportunities || stats.total === 0}
                    sx={{
                      borderRadius: 1,
                      position: 'relative',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.error.main, 0.08),
                      },
                    }}
                  >
                    {isResettingOpportunities ? (
                      <CircularProgress
                        size={16}
                        sx={{
                          color: theme.palette.error.main,
                          position: 'absolute',
                        }}
                      />
                    ) : (
                      <ResetAllIcon sx={{ fontSize: 20 }} />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>
        </Paper>

        {/* Scraper Status */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.background.paper, 0.6),
          }}
        >
          <ScraperControlPanel />
        </Paper>

        {/* Opportunities Tables */}
        <Stack spacing={3}>
          {/* Staged Opportunities */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: alpha(theme.palette.background.paper, 0.6),
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                p: 2.5,
                borderBottom: `1px solid ${theme.palette.divider}`,
                bgcolor: alpha(theme.palette.background.paper, 0.6),
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <PendingIcon sx={{ fontSize: 20, color: theme.palette.warning.main }} />
                <Typography variant="h6" fontWeight="500">
                  Staged Opportunities ({stagedOpportunities.length})
                </Typography>
              </Stack>
            </Box>
            <OpportunitiesTable
              opportunities={stagedOpportunities}
              totalCount={stagedOpportunities.length}
              pagination={pagination}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              onPreview={handlePreview}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </Paper>

          {/* Approved Opportunities */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: alpha(theme.palette.background.paper, 0.6),
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                p: 2.5,
                borderBottom: `1px solid ${theme.palette.divider}`,
                bgcolor: alpha(theme.palette.background.paper, 0.6),
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <ApproveIcon sx={{ fontSize: 20, color: theme.palette.success.main }} />
                <Typography variant="h6" fontWeight="500">
                  Approved Opportunities ({stats.approved})
                </Typography>
              </Stack>
            </Box>
            <OpportunitiesTable
              opportunities={approvedOpportunities}
              totalCount={stats.approved}
              pagination={pagination}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              onPreview={handlePreview}
              onApprove={handleApprove}
              onReject={handleReject}
              showApproveButton={false}
              rejectTooltip="Move back to staged"
            />
          </Paper>
        </Stack>
      </Stack>

      {/* Modals */}
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

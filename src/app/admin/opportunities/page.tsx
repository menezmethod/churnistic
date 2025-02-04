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
  KeyboardArrowDown as KeyboardArrowDownIcon,
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
import { useState, useMemo, useCallback, JSX, useEffect } from 'react';

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
      <CardContent
        sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}
      >
        <Stack direction="row" alignItems="center" spacing={{ xs: 1.5, sm: 2 }}>
          <Box
            sx={{
              p: { xs: 1.5, sm: 2 },
              borderRadius: 2,
              bgcolor: alpha(color, 0.15),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: { xs: 40, sm: 48 },
              height: { xs: 40, sm: 48 },
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="h4"
              fontWeight="bold"
              sx={{
                color: theme.palette.text.primary,
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                lineHeight: 1.2,
                mb: 0.5,
              }}
            >
              {prefix && <span style={{ opacity: 0.7 }}>{prefix}</span>}
              {(value || 0).toLocaleString()}
              {suffix && <span style={{ opacity: 0.7 }}>{suffix}</span>}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
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
  searchTerm = '',
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
  searchTerm?: string;
}) => {
  const theme = useTheme();

  const filteredOpportunities = useMemo(() => {
    if (!opportunities) return [];

    const searchLower = searchTerm.toLowerCase().trim();
    return opportunities.filter((opp) => {
      return (
        opp.name?.toLowerCase().includes(searchLower) ||
        opp.type?.toLowerCase().includes(searchLower) ||
        opp.description?.toLowerCase().includes(searchLower) ||
        opp.status?.toLowerCase().includes(searchLower) ||
        opp.value?.toString().toLowerCase().includes(searchLower) ||
        (opp.details?.credit_score &&
          typeof (opp.details.credit_score as { min?: number }).min !== 'undefined' &&
          (opp.details.credit_score as { min?: number }).min
            ?.toString()
            .toLowerCase()
            .includes(searchLower)) ||
        (opp.details?.minimum_deposit &&
          opp.details.minimum_deposit.toString().toLowerCase().includes(searchLower)) ||
        (opp.details?.account_type &&
          opp.details.account_type.toLowerCase().includes(searchLower))
      );
    });
  }, [opportunities, searchTerm]);

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
        rows={filteredOpportunities}
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
  const [stagedExpanded, setStagedExpanded] = useState(false);
  const [approvedExpanded, setApprovedExpanded] = useState(false);

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
      setSearchTerm(value);
      setPagination({
        ...pagination,
        page: 1,
        filters: { ...pagination.filters, search: value },
      });
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

  return (
    <Container
      maxWidth={false}
      sx={{
        py: { xs: 2, sm: 3 },
        px: { xs: 1.5, sm: 2, md: 3 },
        minHeight: '100vh',
      }}
    >
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={{ xs: 2, sm: 0 }}
        >
          <Stack spacing={0.5}>
            <Typography
              variant="h4"
              fontWeight="500"
              color="text.primary"
              sx={{
                letterSpacing: -0.5,
                fontSize: { xs: '1.5rem', sm: '2rem' },
              }}
            >
              Opportunities
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Manage and review financial opportunities
            </Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              justifyContent: { xs: 'space-between', sm: 'flex-start' },
            }}
          >
            <Tooltip
              title={isLoading ? 'Importing...' : 'Import new opportunities'}
              arrow
              placement="bottom"
            >
              <span>
                <IconButton
                  color="primary"
                  onClick={handleSync}
                  disabled={isLoading}
                  sx={{
                    borderRadius: 1,
                    position: 'relative',
                    p: 1.5,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={20} color="primary" />
                  ) : (
                    <ImportIcon sx={{ fontSize: 20 }} />
                  )}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip
              title={isBulkApproving ? 'Processing...' : 'Approve all staged'}
              arrow
              placement="bottom"
            >
              <span>
                <IconButton
                  color="success"
                  onClick={() => setBulkApproveDialogOpen(true)}
                  disabled={isBulkApproving || stats.pending === 0}
                  sx={{
                    borderRadius: 1,
                    position: 'relative',
                    p: 1.5,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.success.main, 0.08),
                    },
                  }}
                >
                  {isBulkApproving ? (
                    <CircularProgress size={20} color="success" />
                  ) : (
                    <BulkApproveIcon sx={{ fontSize: 20 }} />
                  )}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip
              title={isResettingStagedOffers ? 'Clearing...' : 'Clear staged offers'}
              arrow
              placement="bottom"
            >
              <span>
                <IconButton
                  color="warning"
                  onClick={() => setResetStagedDialogOpen(true)}
                  disabled={isResettingStagedOffers || !hasStagedOpportunities}
                  sx={{
                    borderRadius: 1,
                    position: 'relative',
                    p: 1.5,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.warning.main, 0.08),
                    },
                  }}
                >
                  {isResettingStagedOffers ? (
                    <CircularProgress size={20} color="warning" />
                  ) : (
                    <ResetIcon sx={{ fontSize: 20 }} />
                  )}
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip
              title={isResettingOpportunities ? 'Resetting...' : 'Reset all data'}
              arrow
              placement="bottom"
            >
              <span>
                <IconButton
                  color="error"
                  onClick={() => setResetAllDialogOpen(true)}
                  disabled={isResettingOpportunities || stats.total === 0}
                  sx={{
                    borderRadius: 1,
                    position: 'relative',
                    p: 1.5,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.error.main, 0.08),
                    },
                  }}
                >
                  {isResettingOpportunities ? (
                    <CircularProgress size={20} color="error" />
                  ) : (
                    <ResetAllIcon sx={{ fontSize: 20 }} />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12} lg={4}>
          <Stack spacing={{ xs: 2, sm: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: alpha(theme.palette.background.paper, 0.6),
              }}
            >
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
                        sx={{
                          fontSize: { xs: 18, sm: 20 },
                          color: theme.palette.text.secondary,
                        }}
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
            </Paper>

            <Box sx={{ mx: -1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ p: 1 }}>
                    <StatsCard
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
                    <StatsCard
                      title="Pending Review"
                      value={stats.pending}
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
                    <StatsCard
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
                    <StatsCard
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

            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: alpha(theme.palette.background.paper, 0.6),
              }}
            >
              <Typography
                variant="h6"
                fontWeight="500"
                sx={{
                  mb: { xs: 1.5, sm: 2 },
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                }}
              >
                Distribution
              </Typography>
              <Stack spacing={{ xs: 1.5, sm: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <BankIcon sx={{ fontSize: 20, color: theme.palette.success.main }} />
                    <Typography>Bank Offers</Typography>
                  </Stack>
                  <Typography fontWeight="500">{stats.byType.bank}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CardIcon sx={{ fontSize: 20, color: theme.palette.info.main }} />
                    <Typography>Credit Card Offers</Typography>
                  </Stack>
                  <Typography fontWeight="500">{stats.byType.credit_card}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <BrokerageIcon
                      sx={{ fontSize: 20, color: theme.palette.secondary.main }}
                    />
                    <Typography>Brokerage Offers</Typography>
                  </Stack>
                  <Typography fontWeight="500">{stats.byType.brokerage}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ValueIcon sx={{ fontSize: 20, color: theme.palette.error.main }} />
                    <Typography>High Value ($500+)</Typography>
                  </Stack>
                  <Typography fontWeight="500">{stats.highValue}</Typography>
                </Stack>
              </Stack>
            </Paper>

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
            </Paper>
          </Stack>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Stack spacing={{ xs: 2, sm: 3 }}>
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
                onClick={() => setStagedExpanded(!stagedExpanded)}
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  borderBottom: stagedExpanded
                    ? `1px solid ${theme.palette.divider}`
                    : 'none',
                  bgcolor: alpha(theme.palette.background.paper, 0.8),
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.background.paper, 0.9),
                  },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
                    <PendingIcon
                      sx={{
                        fontSize: { xs: 20, sm: 24 },
                        color: theme.palette.warning.main,
                      }}
                    />
                    <Typography
                      variant="h6"
                      fontWeight="500"
                      sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                    >
                      Staged Opportunities ({stagedOpportunities.length})
                    </Typography>
                  </Stack>
                  <IconButton
                    size="small"
                    sx={{
                      transform: stagedExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    <KeyboardArrowDownIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                  </IconButton>
                </Stack>
              </Box>
              <Box
                sx={{
                  height: stagedExpanded ? 'auto' : 0,
                  overflow: 'hidden',
                  transition: 'height 0.3s ease',
                }}
              >
                {stagedExpanded && (
                  <OpportunitiesTable
                    opportunities={stagedOpportunities}
                    totalCount={stagedOpportunities.length}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    onPreview={handlePreview}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    searchTerm={searchTerm}
                  />
                )}
              </Box>
            </Paper>

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
                onClick={() => setApprovedExpanded(!approvedExpanded)}
                sx={{
                  p: 2,
                  borderBottom: approvedExpanded
                    ? `1px solid ${theme.palette.divider}`
                    : 'none',
                  bgcolor: alpha(theme.palette.background.paper, 0.8),
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.background.paper, 0.9),
                  },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
                    <ApproveIcon
                      sx={{ fontSize: 24, color: theme.palette.success.main }}
                    />
                    <Typography variant="h6" fontWeight="500">
                      Approved Opportunities ({stats.approved})
                    </Typography>
                  </Stack>
                  <IconButton
                    size="small"
                    sx={{
                      transform: approvedExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    <KeyboardArrowDownIcon />
                  </IconButton>
                </Stack>
              </Box>
              <Box
                sx={{
                  height: approvedExpanded ? 'auto' : 0,
                  overflow: 'hidden',
                  transition: 'height 0.3s ease',
                }}
              >
                {approvedExpanded && (
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
                    searchTerm={searchTerm}
                  />
                )}
              </Box>
            </Paper>
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

      <ResetStagedDialog />
      <ResetAllDialog />
      <BulkApproveDialog />
    </Container>
  );
};

export default OpportunitiesPage;

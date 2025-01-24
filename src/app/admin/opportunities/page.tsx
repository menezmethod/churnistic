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
} from '@mui/material';
import { useState } from 'react';

import { OpportunityPreviewModal } from './components/OpportunityPreviewModal';
import { useOpportunities } from './hooks/useOpportunities';
import { Opportunity } from './types/opportunity';

const StatsCard = ({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}20` }}>{icon}</Box>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {value}
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
  } = useOpportunities();

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

  const getStatusChip = (status: string) => {
    switch (status) {
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

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Stats Cards */}
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
            title="Bank Offers"
            value={opportunities.filter((opp) => opp.type === 'bank').length}
            icon={<BankIcon sx={{ color: theme.palette.success.main }} />}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatsCard
            title="Credit Card Offers"
            value={opportunities.filter((opp) => opp.type === 'credit_card').length}
            icon={<CardIcon sx={{ color: theme.palette.info.main }} />}
            color={theme.palette.info.main}
          />
        </Grid>

        {/* Search and Filters */}
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
                {opportunities.map((opportunity: Opportunity) => (
                  <TableRow key={opportunity.id} hover>
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
                        onClick={() => setSelectedOpportunity(opportunity)}
                        color="primary"
                      >
                        <PreviewIcon />
                      </IconButton>
                      <IconButton
                        color="success"
                        onClick={() => approveOpportunity(opportunity.id)}
                        disabled={opportunity.status !== 'pending'}
                      >
                        <ApproveIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => rejectOpportunity(opportunity.id)}
                        disabled={opportunity.status !== 'pending'}
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
      <OpportunityPreviewModal
        opportunity={selectedOpportunity}
        open={!!selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
        onApprove={
          selectedOpportunity
            ? () => approveOpportunity(selectedOpportunity.id)
            : undefined
        }
        onReject={
          selectedOpportunity
            ? () => rejectOpportunity(selectedOpportunity.id)
            : undefined
        }
      />
    </Container>
  );
};

export default OpportunitiesPage;

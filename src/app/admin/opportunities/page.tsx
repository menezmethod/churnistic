'use client';

import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import {
  Box,
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Stack,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Badge,
} from '@mui/material';
import { useState } from 'react';

// Mock data based on the Core Opportunity Model
const mockOpportunities = [
  {
    id: '1',
    name: 'Chase Sapphire Preferred®',
    type: 'credit_card',
    bank: 'Chase',
    value: 800,
    status: 'pending',
    source: {
      name: 'Doctor of Credit',
      collected_at: '2024-01-05T10:30:00Z',
    },
    bonus: {
      title: '80,000 Points Bonus',
      value: 800,
      requirements: [
        {
          type: 'spend',
          details: { amount: 4000, period: 90 },
        },
      ],
    },
    processing_status: {
      source_validation: true,
      ai_processed: true,
      duplicate_checked: true,
      needs_review: true,
    },
    ai_insights: {
      confidence_score: 0.92,
      validation_warnings: ['Bonus amount changed recently'],
      potential_duplicates: ['chase-sapphire-preferred-75k'],
    },
  },
  {
    id: '2',
    name: 'Citi Premier® Card',
    type: 'credit_card',
    bank: 'Citi',
    value: 600,
    status: 'pending',
    source: {
      name: 'BankRewards.io',
      collected_at: '2024-01-05T09:15:00Z',
    },
    bonus: {
      title: '60,000 Points Bonus',
      value: 600,
      requirements: [
        {
          type: 'spend',
          details: { amount: 4000, period: 90 },
        },
      ],
    },
    processing_status: {
      source_validation: true,
      ai_processed: true,
      duplicate_checked: true,
      needs_review: true,
    },
    ai_insights: {
      confidence_score: 0.88,
      validation_warnings: [],
      potential_duplicates: [],
    },
  },
  {
    id: '3',
    name: 'Capital One Checking',
    type: 'bank',
    bank: 'Capital One',
    value: 400,
    status: 'pending',
    source: {
      name: 'Doctor of Credit',
      collected_at: '2024-01-05T08:45:00Z',
    },
    bonus: {
      title: '$400 Checking Bonus',
      value: 400,
      requirements: [
        {
          type: 'direct_deposit',
          details: { amount: 2000, period: 60 },
        },
      ],
    },
    processing_status: {
      source_validation: true,
      ai_processed: true,
      duplicate_checked: false,
      needs_review: true,
    },
    ai_insights: {
      confidence_score: 0.95,
      validation_warnings: ['Similar to existing offer'],
      potential_duplicates: ['capital-one-checking-300'],
    },
  },
];

export default function OfferValidationPage() {
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ width: '100%', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Offer Validation
        </Typography>

        {/* Tabs and Actions */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
              <Tab
                label={
                  <Badge badgeContent={5} color="error">
                    Pending Review
                  </Badge>
                }
              />
              <Tab label="Approved" />
              <Tab label="Rejected" />
            </Tabs>
            <Stack direction="row" spacing={2}>
              <TextField
                size="small"
                placeholder="Search offers..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={handleFilterClick}
              >
                Filter
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* Filter Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleFilterClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem>Credit Cards Only</MenuItem>
          <MenuItem>Bank Accounts Only</MenuItem>
          <MenuItem>High Value ($500+)</MenuItem>
          <MenuItem>New Sources</MenuItem>
          <MenuItem>Has Warnings</MenuItem>
        </Menu>

        {/* Opportunities Table */}
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell>Offer Details</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Requirements</TableCell>
                <TableCell>AI Insights</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockOpportunities.map((opp) => (
                <TableRow key={opp.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">{opp.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {opp.bonus.title}
                      </Typography>
                      <Chip
                        size="small"
                        label={opp.type === 'credit_card' ? 'Credit Card' : 'Bank Account'}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{opp.source.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(opp.source.collected_at).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {opp.bonus.requirements.map((req, index) => (
                      <Typography key={index} variant="body2">
                        {req.type === 'spend'
                          ? `Spend $${req.details.amount} in ${req.details.period} days`
                          : `Direct deposit $${req.details.amount} in ${req.details.period} days`}
                      </Typography>
                    ))}
                  </TableCell>
                  <TableCell>
                    <Stack spacing={1}>
                      <Typography variant="body2">
                        Confidence: {(opp.ai_insights.confidence_score * 100).toFixed(0)}%
                      </Typography>
                      {opp.ai_insights.validation_warnings.map((warning, index) => (
                        <Chip
                          key={index}
                          size="small"
                          icon={<WarningIcon />}
                          label={warning}
                          color="warning"
                        />
                      ))}
                      {opp.ai_insights.potential_duplicates.length > 0 && (
                        <Chip
                          size="small"
                          icon={<WarningIcon />}
                          label={`${opp.ai_insights.potential_duplicates.length} potential duplicate(s)`}
                          color="warning"
                        />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <IconButton color="success" size="small">
                        <ApproveIcon />
                      </IconButton>
                      <IconButton color="error" size="small">
                        <RejectIcon />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={mockOpportunities.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      </Box>
    </Container>
  );
} 
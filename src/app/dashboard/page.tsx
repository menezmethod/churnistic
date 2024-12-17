'use client';

import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AccountBalance,
  CreditCard as CreditCardIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Timeline as TimelineIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Assessment,
  AssignmentTurnedIn,
  RadioButtonUnchecked,
  NotificationsNone,
  Launch,
  Dashboard,
  ArrowRight,
} from '@mui/icons-material';
import {
  Card,
  Grid,
  Typography,
  Box,
  LinearProgress,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Menu,
  MenuItem,
  Collapse,
  Divider,
  Stack,
  Checkbox,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import { useState } from 'react';

interface Requirement {
  description: string;
  progress?: number;
  status: 'pending' | 'in_progress' | 'verified';
}

interface Notification {
  type: string;
  message: string;
  date: string;
}

interface Opportunity {
  id: string;
  type: 'credit_card' | 'bank_account';
  title: string;
  description: string;
  value: string;
  status: string;
  card_name?: string;
  bank_name: string;
  signup_bonus?: string;
  bonus_amount: string;
  requirements: Requirement[];
  risk_level: number;
  risk_factors: string[];
  time_limit: string;
  deadline: string;
  expiration: string;
  source: string;
  source_link: string;
  location_eligible: boolean;
  auto_tracked: boolean;
  notifications: Notification[];
}

interface RiskFactors {
  credit_inquiries_6mo: number;
  bank_accounts_6mo: number;
  chase_524_status: string;
  amex_velocity: string;
  chexsystems_inquiries: number;
}

interface RiskAssessment {
  overview: string;
  overall_risk_level: number;
  risk_factors: RiskFactors;
}

interface SummaryStats {
  total_value: number;
  opportunities_count: {
    credit_cards: number;
    bank_accounts: number;
    total: number;
  };
  success_rate: number;
  average_completion_time: number;
  total_earned_ytd: number;
}

interface TimelineEvent {
  date: string;
  type: string;
  description: string;
  status: string;
}

const getRiskIcon = (level: number) => {
  if (level <= 2) return <CheckCircleIcon color="success" />;
  if (level <= 3) return <InfoIcon color="info" />;
  if (level <= 4) return <WarningIcon color="warning" />;
  return <ErrorIcon color="error" />;
};

const getRiskColor = (level: number) => {
  if (level <= 2) return 'success.main';
  if (level <= 3) return 'info.main';
  if (level <= 4) return 'warning.main';
  return 'error.main';
};

const StatsOverview = ({ stats }: { stats: SummaryStats }) => (
  <Card sx={{ p: 3, mb: 3 }}>
    <Grid container spacing={3}>
      <Grid item xs={12} sm={4}>
        <Box textAlign="center">
          <Typography variant="h4" color="primary">
            ${stats.total_earned_ytd.toLocaleString()}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Total Earned YTD
          </Typography>
        </Box>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Box textAlign="center">
          <Typography variant="h4" color="success.main">
            {(stats.success_rate * 100).toFixed(1)}%
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Success Rate
          </Typography>
        </Box>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Box textAlign="center">
          <Typography variant="h4">
            {stats.opportunities_count.total}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Active Opportunities
          </Typography>
        </Box>
      </Grid>
    </Grid>
  </Card>
);

const ChurningTimeline = ({ events }: { events: TimelineEvent[] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);

  const filterOptions = [
    'Points Posted',
    'Spending Alert',
    'Bank Bonus',
    'Application',
    'Card Arrival',
    'Direct Deposit',
    'Account Closed',
    'Eligibility'
  ];

  const sortOptions = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Oldest First', value: 'oldest' },
    { label: 'Status', value: 'status' }
  ];

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilters.length === 0 || selectedFilters.includes(event.type);
    return matchesSearch && matchesFilter;
  });

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        mb: 3,
        bgcolor: 'background.paper',
        borderColor: 'divider',
      }}
    >
      <Box p={3}>
        {/* Header */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <TimelineIcon sx={{ color: 'primary.main', opacity: 0.8 }} />
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 500 }}>
              Activity Timeline
            </Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              size="small"
              sx={{
                color: 'text.secondary',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover'
                }
              }}
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={(e) => setFilterAnchorEl(e.currentTarget)}
            >
              Filter
            </Button>
            <Button
              size="small"
              sx={{
                color: 'text.secondary',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover'
                }
              }}
              variant="outlined"
              startIcon={<SortIcon />}
              onClick={(e) => setSortAnchorEl(e.currentTarget)}
            >
              Sort
            </Button>
          </Box>
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search activities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.default',
              '& fieldset': {
                borderColor: 'divider',
                borderWidth: '1px',
                opacity: 0.1
              },
              '&:hover fieldset': {
                borderColor: 'divider',
                opacity: 0.3
              },
              '&.Mui-focused fieldset': {
                borderColor: 'primary.main',
                opacity: 1
              }
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', opacity: 0.7 }} />
              </InputAdornment>
            )
          }}
        />

        {/* Timeline */}
        <Box sx={{ 
          maxHeight: 400, 
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            width: '6px'
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent'
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '3px'
          }
        }}>
          {filteredEvents.map((event, index) => (
            <Box
              key={index}
              sx={{
                position: 'relative',
                pl: 3,
                pb: 3,
                '&:last-child': {
                  pb: 0
                },
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  left: '0.35rem',
                  top: '1.5rem',
                  bottom: 0,
                  width: '1px',
                  bgcolor: 'divider',
                  opacity: 0.5
                }
              }}
            >
              <Box display="flex" flexDirection="column" gap={0.5}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: '5rem' }}>
                    {event.date}
                  </Typography>
                  <Chip
                    label={event.type}
                    size="small"
                    sx={{
                      height: '1.25rem',
                      fontSize: '0.75rem',
                      bgcolor: 'background.default',
                      color: 'text.secondary',
                      '& .MuiChip-label': {
                        px: 1
                      }
                    }}
                  />
                  <Chip
                    label={event.status}
                    size="small"
                    sx={{
                      height: '1.25rem',
                      fontSize: '0.75rem',
                      bgcolor: event.status === 'completed' ? 'success.dark' :
                              event.status === 'pending' ? 'warning.dark' : 'info.dark',
                      color: '#fff',
                      '& .MuiChip-label': {
                        px: 1
                      }
                    }}
                  />
                </Box>
                <Box 
                  sx={{ 
                    position: 'relative',
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      left: '-1.125rem',
                      top: '0.35rem',
                      width: '0.5rem',
                      height: '0.5rem',
                      borderRadius: '50%',
                      bgcolor: event.status === 'completed' ? 'success.main' :
                              event.status === 'pending' ? 'warning.main' : 'info.main'
                    }
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'text.primary', pl: 0 }}>
                    {event.description}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Menus */}
        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={() => setFilterAnchorEl(null)}
          PaperProps={{
            sx: {
              bgcolor: 'background.paper',
              borderRadius: 1,
              boxShadow: 2
            }
          }}
        >
          {filterOptions.map((option) => (
            <MenuItem
              key={option}
              onClick={() => {
                if (selectedFilters.includes(option)) {
                  setSelectedFilters(selectedFilters.filter(f => f !== option));
                } else {
                  setSelectedFilters([...selectedFilters, option]);
                }
              }}
              sx={{ minWidth: 200 }}
            >
              <Checkbox
                checked={selectedFilters.includes(option)}
                size="small"
                sx={{ 
                  color: 'text.secondary',
                  '&.Mui-checked': {
                    color: 'primary.main'
                  }
                }}
              />
              <Typography variant="body2">{option}</Typography>
            </MenuItem>
          ))}
        </Menu>

        <Menu
          anchorEl={sortAnchorEl}
          open={Boolean(sortAnchorEl)}
          onClose={() => setSortAnchorEl(null)}
          PaperProps={{
            sx: {
              bgcolor: 'background.paper',
              borderRadius: 1,
              boxShadow: 2
            }
          }}
        >
          {sortOptions.map((option) => (
            <MenuItem
              key={option.value}
              onClick={() => setSortAnchorEl(null)}
              sx={{ minWidth: 200 }}
            >
              <Typography variant="body2">{option.label}</Typography>
            </MenuItem>
          ))}
        </Menu>
      </Box>
    </Card>
  );
};

const gridColumns: GridColDef[] = [
  { field: 'title', headerName: 'Opportunity', width: 200 },
  { field: 'type', headerName: 'Type', width: 130 },
  { field: 'value', headerName: 'Value', width: 100 },
  { 
    field: 'risk_level',
    headerName: 'Risk',
    width: 130,
    renderCell: (params: GridRenderCellParams) => (
      <Box display="flex" alignItems="center" gap={1}>
        {getRiskIcon(params.value as number)}
        <Typography>{params.value}/5</Typography>
      </Box>
    )
  },
  { field: 'deadline', headerName: 'Deadline', width: 130 },
  {
    field: 'progress',
    headerName: 'Progress',
    width: 200,
    renderCell: (params: GridRenderCellParams) => {
      const req = (params.row as Opportunity).requirements.find(r => r.progress !== undefined);
      if (!req) return null;
      const target = parseInt(req.description.match(/\$([0-9,]+)/)?.[1].replace(',', '') || '0');
      const progress = target > 0 ? (req.progress || 0) / target * 100 : 0;
      return (
        <Box sx={{ width: '100%' }}>
          <LinearProgress variant="determinate" value={progress} />
        </Box>
      );
    }
  },
];

const OpportunitiesGrid = ({ opportunities }: { opportunities: Opportunity[] }) => {
  return (
    <Card sx={{ height: 400, mb: 3 }}>
      <DataGrid
        rows={opportunities}
        columns={gridColumns}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 5, page: 0 },
          },
        }}
        pageSizeOptions={[5, 10, 25]}
        checkboxSelection
        disableRowSelectionOnClick
      />
    </Card>
  );
};

const OpportunitiesFilters = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <Box display="flex" gap={2} mb={3}>
      <TextField
        placeholder="Search opportunities..."
        size="small"
        fullWidth
        sx={{
          '& .MuiOutlinedInput-root': {
            bgcolor: 'background.default',
            borderRadius: 1,
            '& fieldset': {
              borderColor: 'divider',
              borderWidth: '1px',
              opacity: 0.1
            },
            '&:hover fieldset': {
              borderColor: 'divider',
              opacity: 0.3
            },
            '&.Mui-focused fieldset': {
              borderColor: 'primary.main',
              opacity: 1
            }
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: 'text.secondary', opacity: 0.7 }} />
            </InputAdornment>
          )
        }}
      />
      <Button
        size="small"
        variant="outlined"
        startIcon={<FilterListIcon />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          minWidth: 90,
          color: 'text.secondary',
          borderColor: 'divider',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover'
          }
        }}
      >
        Filter
      </Button>
      <Button
        size="small"
        variant="outlined"
        startIcon={<SortIcon />}
        sx={{
          minWidth: 90,
          color: 'text.secondary',
          borderColor: 'divider',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover'
          }
        }}
      >
        Sort
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            borderRadius: 1,
            boxShadow: 2,
            mt: 1
          }
        }}
      >
        <MenuItem>Credit Cards Only</MenuItem>
        <MenuItem>Bank Accounts Only</MenuItem>
        <MenuItem>High Value ($1000+)</MenuItem>
        <MenuItem>Low Risk Only</MenuItem>
        <MenuItem>Ending Soon</MenuItem>
      </Menu>
    </Box>
  );
};

const OpportunityCard = ({ opportunity }: { opportunity: Opportunity }) => {
  const spendingReq = opportunity.requirements.find(r => r.progress !== undefined);
  const target = spendingReq ? 
    parseInt(spendingReq.description.match(/\$([0-9,]+)/)?.[1].replace(',', '') || '0') : 
    0;

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <Box p={2} display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center" gap={2}>
          {opportunity.type === 'credit_card' ? 
            <CreditCardIcon color="primary" /> : 
            <AccountBalance color="primary" />
          }
          <Box>
            <Typography variant="h6" sx={{ mb: 0.5 }}>{opportunity.title}</Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip 
                size="small" 
                label={opportunity.bank_name}
                sx={{ bgcolor: 'action.hover' }}
              />
              <Typography variant="body2" color="text.secondary">
                {opportunity.time_limit} timeframe
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Box textAlign="right">
            <Typography variant="h6" color="primary">{opportunity.value}</Typography>
            <Typography variant="caption" color="text.secondary">Estimated Value</Typography>
          </Box>
          <ExpandMoreIcon />
        </Box>
      </Box>

      <Collapse in={true}>
        <Divider />
        <Box p={2}>
          <Grid container spacing={3}>
            {/* Requirements Section */}
            <Grid item xs={12} md={8}>
              <Box mb={3}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignmentTurnedIn fontSize="small" /> Requirements
                </Typography>
                {opportunity.requirements.map((req, index) => (
                  <Box key={index} sx={{ mt: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      {req.status === 'verified' ? (
                        <CheckCircleIcon color="primary" fontSize="small" />
                      ) : (
                        <RadioButtonUnchecked fontSize="small" sx={{ color: 'text.secondary' }} />
                      )}
                      <Typography variant="body2">{req.description}</Typography>
                    </Box>
                    {req.progress !== undefined && target > 0 && (
                      <Box pl={3}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                          <Typography variant="caption" color="text.secondary">
                            ${req.progress.toLocaleString()} of ${target.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="primary">
                            {Math.round((req.progress / target) * 100)}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={(req.progress / target) * 100}
                          sx={{ height: 4, borderRadius: 1 }}
                        />
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>

              {/* Updates Section */}
              {opportunity.notifications && opportunity.notifications.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NotificationsNone fontSize="small" /> Updates
                  </Typography>
                  <Stack spacing={1}>
                    {opportunity.notifications.map((notification, index) => (
                      <Box key={index} display="flex" alignItems="center" gap={2}>
                        <Chip 
                          size="small"
                          label={notification.date}
                          sx={{ bgcolor: 'action.hover', minWidth: 100 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          {notification.message}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Grid>

            {/* Risk Section */}
            <Grid item xs={12} md={4}>
              <Box bgcolor="action.hover" p={2} borderRadius={2}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Assessment fontSize="small" /> Risk Assessment
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  {getRiskIcon(opportunity.risk_level)}
                  <Typography variant="body2" color={getRiskColor(opportunity.risk_level)}>
                    Level {opportunity.risk_level}/5
                  </Typography>
                </Box>
                <Stack spacing={1}>
                  {opportunity.risk_factors.map((factor, index) => (
                    <Typography key={index} variant="body2" sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      color: 'text.secondary'
                    }}>
                      <ArrowRight fontSize="small" />
                      {factor}
                    </Typography>
                  ))}
                </Stack>
              </Box>

              <Box mt={2}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<Launch fontSize="small" />}
                  href={opportunity.source_link}
                  target="_blank"
                >
                  View Details
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    </Card>
  );
};

const RiskAssessmentCard = ({ riskAssessment }: { riskAssessment: RiskAssessment }) => (
  <Card sx={{ p: 3, mb: 2 }}>
    <Typography variant="h6" gutterBottom>Risk Assessment</Typography>
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          {getRiskIcon(riskAssessment.overall_risk_level)}
          <Typography>{riskAssessment.overview}</Typography>
        </Box>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="subtitle2" gutterBottom>Key Risk Metrics:</Typography>
        <Box display="flex" flexDirection="column" gap={1}>
          {Object.entries(riskAssessment.risk_factors).map(([key, value]) => (
            <Box key={key} display="flex" alignItems="center" gap={1}>
              <InfoIcon fontSize="small" />
              <Typography variant="body2">
                {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}: {value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Grid>
    </Grid>
  </Card>
);

const SummaryCard = ({ summary }: { summary: typeof mockData.summary }) => (
  <Card variant="outlined" sx={{ mb: 3 }}>
    <Box p={2}>
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <Dashboard fontSize="large" color="primary" />
        <Typography variant="h6">Overview</Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Current Status
              </Typography>
              <Typography variant="body1">{summary.overview}</Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Tracking Stats
              </Typography>
              <Grid container spacing={2}>
                {[
                  { label: 'Auto-tracked', value: summary.tracking_stats.auto_tracked, color: 'primary' },
                  { label: 'Completed', value: summary.tracking_stats.completed, color: 'success' },
                  { label: 'In Progress', value: summary.tracking_stats.in_progress, color: 'warning' },
                  { label: 'Manual', value: summary.tracking_stats.manual_tracked, color: 'info' }
                ].map((stat) => (
                  <Grid item xs={6} key={stat.label}>
                    <Box>
                      <Typography variant="h5" color={`${stat.color}.main`} sx={{ mb: 0.5 }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.label}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Stack>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Value Metrics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box bgcolor="action.hover" p={2} borderRadius={2}>
                  <Typography variant="h5" color="primary">
                    ${summary.total_value.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Value
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box bgcolor="action.hover" p={2} borderRadius={2}>
                  <Typography variant="h5">
                    {summary.total_opportunities}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Opportunities
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box bgcolor="action.hover" p={2} borderRadius={2}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h5" color={summary.average_risk > 3 ? 'warning.main' : 'success.main'}>
                        {summary.average_risk.toFixed(1)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Average Risk Level
                      </Typography>
                    </Box>
                    {getRiskIcon(summary.average_risk)}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Box>
  </Card>
);

const mockTimelineEvents: TimelineEvent[] = [
  {
    date: '2024-02-15',
    type: 'Points Posted',
    description: 'Chase Sapphire Preferred: 60,000 UR points posted (Value: $750+)',
    status: 'completed'
  },
  {
    date: '2024-02-14',
    type: 'Spending Alert',
    description: 'Amex Platinum: $1,000 more needed in 15 days for 150k bonus',
    status: 'pending'
  },
  {
    date: '2024-02-13',
    type: 'Bank Bonus',
    description: 'Citi Checking $700 bonus posted to account',
    status: 'completed'
  },
  {
    date: '2024-02-12',
    type: 'Application',
    description: 'Capital One Venture X instant approval (CL: $30,000)',
    status: 'completed'
  },
  {
    date: '2024-02-10',
    type: 'Eligibility',
    description: 'Chase 5/24 status: New slot opens in 30 days',
    status: 'in_progress'
  },
  {
    date: '2024-02-08',
    type: 'Direct Deposit',
    description: 'US Bank $500 bonus: 2nd DD confirmed ($2,500/$5,000)',
    status: 'in_progress'
  },
  {
    date: '2024-02-05',
    type: 'Card Arrival',
    description: 'Amex Gold Card received & activated, added to mobile wallet',
    status: 'completed'
  },
  {
    date: '2024-02-03',
    type: 'Retention Offer',
    description: 'Amex Platinum: Accepted 55k points for $4k spend',
    status: 'in_progress'
  },
  {
    date: '2024-02-01',
    type: 'Account Closed',
    description: 'Chase United Explorer closed (AF posted, no retention)',
    status: 'completed'
  },
  {
    date: '2024-01-30',
    type: 'Bonus Terms',
    description: 'Chase Sapphire Reserve: Now eligible (48 months since last bonus)',
    status: 'completed'
  }
];

const mockStats: SummaryStats = {
  total_value: 3450,
  opportunities_count: {
    credit_cards: 2,
    bank_accounts: 1,
    total: 3
  },
  success_rate: 0.92,
  average_completion_time: 75,
  total_earned_ytd: 2750
};

const mockData = {
  opportunities: [
    {
      id: '1',
      type: 'credit_card' as const,
      title: 'Chase Sapphire Preferred',
      description: 'Premium travel rewards card with high signup bonus',
      value: '$1,250',
      status: 'active',
      card_name: 'Chase Sapphire Preferred',
      bank_name: 'Chase',
      signup_bonus: '60,000 points',
      bonus_amount: '$1,250',
      requirements: [
        { description: 'Spend $4,000 in first 3 months', progress: 2500, status: 'in_progress' as const },
        { description: 'No previous Sapphire bonus in 48 months', status: 'verified' as const }
      ],
      risk_level: 2,
      risk_factors: [
        'Recent Chase applications',
        '5/24 status: 3/24',
        'Good approval odds'
      ],
      time_limit: '3 months',
      deadline: '2024-03-31',
      expiration: '2024-12-31',
      source: 'Doctor of Credit',
      source_link: 'https://doctorofcredit.com/chase-sapphire-preferred',
      location_eligible: true,
      auto_tracked: true,
      notifications: [
        { type: 'deadline', message: 'Spending deadline in 2 weeks', date: '2024-03-17' }
      ]
    },
    {
      id: '2',
      type: 'credit_card' as const,
      title: 'Amex Platinum',
      description: 'Premium travel card with extensive benefits',
      value: '$1,500',
      status: 'active',
      card_name: 'The Platinum Card',
      bank_name: 'American Express',
      signup_bonus: '150,000 points',
      bonus_amount: '$1,500',
      requirements: [
        { description: 'Spend $6,000 in first 6 months', progress: 1000, status: 'in_progress' as const },
        { description: 'No previous bonus on this card', status: 'verified' as const }
      ],
      risk_level: 3,
      risk_factors: [
        'Multiple Amex cards open',
        'Recent Amex bonus received',
        'Moderate approval odds'
      ],
      time_limit: '6 months',
      deadline: '2024-06-30',
      expiration: '2024-06-30',
      source: 'Reddit r/churning',
      source_link: 'https://reddit.com/r/churning',
      location_eligible: true,
      auto_tracked: true,
      notifications: [
        { type: 'spending', message: 'Behind on spending pace', date: '2024-02-15' }
      ]
    },
    {
      id: '3',
      type: 'bank_account' as const,
      title: 'Citi Checking Bonus',
      description: 'High-value checking account bonus',
      value: '$700',
      status: 'active',
      bank_name: 'Citibank',
      bonus_amount: '$700',
      requirements: [
        { description: 'Deposit $50,000 in new money', progress: 40000, status: 'in_progress' as const },
        { description: 'Maintain balance for 60 days', status: 'pending' as const },
        { description: 'Complete qualifying activities', status: 'pending' as const }
      ],
      risk_level: 4,
      risk_factors: [
        'ChexSystems sensitive bank',
        'Recent bank account openings',
        'High early termination fee'
      ],
      time_limit: '60 days',
      deadline: '2024-03-31',
      expiration: '2024-03-31',
      source: 'Doctor of Credit',
      source_link: 'https://doctorofcredit.com/citi-checking',
      location_eligible: true,
      auto_tracked: true,
      notifications: [
        { type: 'deposit', message: 'Deposit deadline approaching', date: '2024-02-20' }
      ]
    }
  ],
  summary: {
    overview: 'Currently tracking 3 high-value churning opportunities worth over $3,000 in total value',
    total_opportunities: 3,
    total_value: 3450,
    average_risk: 3.0,
    tracking_stats: {
      auto_tracked: 3,
      manual_tracked: 0,
      completed: 0,
      in_progress: 3
    }
  },
  riskAssessment: {
    overview: 'Overall risk level is low to moderate, with bank account bonuses showing slightly higher risk',
    overall_risk_level: 3.0,
    risk_factors: {
      credit_inquiries_6mo: 2,
      bank_accounts_6mo: 3,
      chase_524_status: '3/24',
      amex_velocity: 'Moderate',
      chexsystems_inquiries: 4
    }
  },
  recommendations: {
    next_steps: [
      'Increase spending on Chase Sapphire Preferred',
      'Prepare funds for Citi deposit requirement',
      'Monitor Amex spending deadline'
    ],
    upcoming_deadlines: [
      { description: 'Citi deposit deadline', date: '2024-02-28' },
      { description: 'Chase spending requirement', date: '2024-03-31' }
    ]
  }
};

export default function CardsPage() {
  const [view, setView] = useState<'cards' | 'grid'>('cards');
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Churning Dashboard</Typography>
        <Box>
          <Tabs value={view} onChange={(_, newValue) => setView(newValue)}>
            <Tab value="cards" label="Cards View" />
            <Tab value="grid" label="Grid View" />
          </Tabs>
        </Box>
      </Box>

      <StatsOverview stats={mockStats} />
      <SummaryCard summary={mockData.summary} />
      <ChurningTimeline events={mockTimelineEvents} />

      <OpportunitiesFilters />

      {view === 'grid' ? (
        <OpportunitiesGrid opportunities={mockData.opportunities} />
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {mockData.opportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </Grid>
          <Grid item xs={12} md={4}>
            <RiskAssessmentCard riskAssessment={mockData.riskAssessment} />
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Recommendations</Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                {mockData.recommendations.next_steps.map((step: string, index: number) => (
                  <Box key={index} display="flex" alignItems="center" gap={1}>
                    <InfoIcon color="primary" fontSize="small" />
                    <Typography variant="body2">{step}</Typography>
                  </Box>
                ))}
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}
    </div>
  );
}

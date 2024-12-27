'use client';

import {
  AccountBalance as AccountBalanceIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  AssignmentTurnedIn,
  AttachMoney as AttachMoneyIcon,
  Block as BlockIcon,
  Check as CheckIcon,
  CheckCircle as CheckCircleIcon,
  CreditCard as CreditCardIcon,
  CreditScore as CreditScoreIcon,
  Diamond as DiamondIcon,
  ExpandMore as ExpandMoreIcon,
  MonetizationOn as MonetizationOnIcon,
  Payments as PaymentsIcon,
  Public as PublicIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  ShoppingCart as ShoppingCartIcon,
  Timer as TimerIcon,
  Tune as TuneIcon,
  Verified as VerifiedIcon,
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Divider,
  InputAdornment,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useOpportunities } from '@/hooks/useOpportunities';
import { useAuth } from '@/lib/auth/AuthContext';
import { Opportunity } from '@/types/opportunity';

// Add types for opportunities
interface QuickFilter {
  id: string;
  label: string;
  icon: typeof CreditCardIcon;
  color: string;
  filter: (opp: Opportunity) => boolean;
}

const QUICK_FILTERS: QuickFilter[] = [
  {
    id: 'premium_offers',
    label: 'Premium ($500+)',
    icon: MonetizationOnIcon,
    color: '#9c27b0',
    filter: (opp: Opportunity) => opp.value >= 500,
  },
  {
    id: 'credit_card',
    label: 'Credit Cards',
    icon: CreditCardIcon,
    color: '#1976d2',
    filter: (opp: Opportunity) => opp.type === 'credit_card',
  },
  {
    id: 'bank_account',
    label: 'Bank Accounts',
    icon: AccountBalanceIcon,
    color: '#2e7d32',
    filter: (opp: Opportunity) => opp.type === 'bank_account',
  },
  {
    id: 'brokerage',
    label: 'Brokerage',
    icon: MonetizationOnIcon,
    color: '#ed6c02',
    filter: (opp: Opportunity) => opp.type === 'brokerage',
  },
  {
    id: 'quick_bonus',
    label: 'Quick Win',
    icon: TimerIcon,
    color: '#0288d1',
    filter: (opp: Opportunity) =>
      opp.requirements.some(
        (req) =>
          req.toLowerCase().includes('single') ||
          req.toLowerCase().includes('one time') ||
          req.toLowerCase().includes('first')
      ),
  },
  {
    id: 'nationwide',
    label: 'Nationwide',
    icon: PublicIcon,
    color: '#388e3c',
    filter: (opp: Opportunity) =>
      opp.metadata?.availability?.regions?.toLowerCase().includes('nationwide') ||
      opp.metadata?.availability?.regions?.toLowerCase().includes('all states'),
  },
];

// Add new types for smart filtering
interface SmartFilter {
  id: string;
  label: string;
  icon: typeof CreditCardIcon;
  color: string;
  filter: (opp: Opportunity) => boolean;
}

interface FilterGroup {
  label: string;
  filters: SmartFilter[];
}

const FILTER_GROUPS: FilterGroup[] = [
  {
    label: 'Value Tiers',
    filters: [
      {
        id: 'ultra_premium',
        label: 'Ultra ($1000+)',
        icon: DiamondIcon,
        color: '#9c27b0',
        filter: (opp: Opportunity) => opp.value >= 1000,
      },
      {
        id: 'premium',
        label: 'Premium ($500+)',
        icon: MonetizationOnIcon,
        color: '#2e7d32',
        filter: (opp: Opportunity) => opp.value >= 500 && opp.value < 1000,
      },
      {
        id: 'standard',
        label: 'Standard ($200+)',
        icon: AttachMoneyIcon,
        color: '#1976d2',
        filter: (opp: Opportunity) => opp.value >= 200 && opp.value < 500,
      },
    ],
  },
  {
    label: 'Requirements',
    filters: [
      {
        id: 'direct_deposit',
        label: 'Direct Deposit',
        icon: PaymentsIcon,
        color: '#0288d1',
        filter: (opp: Opportunity) =>
          opp.requirements.some((req) => req.toLowerCase().includes('direct deposit')),
      },
      {
        id: 'no_direct_deposit',
        label: 'No DD Required',
        icon: BlockIcon,
        color: '#d32f2f',
        filter: (opp: Opportunity) =>
          !opp.requirements.some((req) => req.toLowerCase().includes('direct deposit')),
      },
      {
        id: 'low_spend',
        label: 'Low Spend',
        icon: ShoppingCartIcon,
        color: '#388e3c',
        filter: (opp: Opportunity) => {
          const spendMatch = opp.requirements.join(' ').match(/\$(\d+)/);
          if (!spendMatch) return false;
          return parseInt(spendMatch[1]) <= 500;
        },
      },
    ],
  },
  {
    label: 'Credit Impact',
    filters: [
      {
        id: 'soft_pull',
        label: 'Soft Pull Only',
        icon: CreditScoreIcon,
        color: '#2e7d32',
        filter: (opp: Opportunity) =>
          opp.metadata.credit?.inquiry?.toLowerCase().includes('soft') ?? false,
      },
      {
        id: 'no_524',
        label: 'No 5/24 Impact',
        icon: CheckCircleIcon,
        color: '#1976d2',
        filter: (opp: Opportunity) =>
          opp.type === 'credit_card' && !opp.metadata.credit?.chase_524_rule,
      },
    ],
  },
  {
    label: 'Fees',
    filters: [
      {
        id: 'no_annual_fee',
        label: 'No Annual Fee',
        icon: AttachMoneyIcon,
        color: '#2e7d32',
        filter: (opp: Opportunity) =>
          opp.type === 'credit_card' &&
          (opp.metadata.fees?.annual?.toLowerCase().includes('no') ?? false),
      },
      {
        id: 'no_monthly_fee',
        label: 'No Monthly Fee',
        icon: PaymentsIcon,
        color: '#2e7d32',
        filter: (opp: Opportunity) =>
          (opp.type === 'bank_account' || opp.type === 'brokerage') &&
          (opp.metadata.fees?.monthly?.toLowerCase().includes('no') ?? false),
      },
      {
        id: 'no_foreign_transaction',
        label: 'No Foreign Transaction',
        icon: PublicIcon,
        color: '#0288d1',
        filter: (opp: Opportunity) =>
          opp.type === 'credit_card' &&
          (opp.metadata.fees?.foreign_transaction?.toLowerCase().includes('no') ?? false),
      },
    ],
  },
  {
    label: 'Availability',
    filters: [
      {
        id: 'nationwide',
        label: 'Nationwide',
        icon: PublicIcon,
        color: '#2e7d32',
        filter: (opp: Opportunity) =>
          opp.metadata.availability?.regions?.toLowerCase().includes('nationwide'),
      },
      {
        id: 'no_citizenship',
        label: 'No Citizenship Req.',
        icon: VerifiedIcon,
        color: '#0288d1',
        filter: (opp: Opportunity) =>
          !opp.metadata.availability?.citizenship_requirements?.length,
      },
      {
        id: 'no_language',
        label: 'No Language Req.',
        icon: CheckCircleIcon,
        color: '#0288d1',
        filter: (opp: Opportunity) =>
          !opp.metadata.availability?.language_requirements?.length,
      },
    ],
  },
  {
    label: 'Timing',
    filters: [
      {
        id: 'quick_approval',
        label: 'Quick Approval',
        icon: TimerIcon,
        color: '#0288d1',
        filter: (opp: Opportunity) =>
          (opp.metadata.timing?.approval_time?.toLowerCase().includes('instant') ??
            false) ||
          (opp.metadata.timing?.approval_time?.toLowerCase().includes('same day') ??
            false),
      },
      {
        id: 'fast_bonus',
        label: 'Fast Bonus Posting',
        icon: MonetizationOnIcon,
        color: '#2e7d32',
        filter: (opp: Opportunity) => {
          const time = opp.metadata.timing?.bonus_posting_time?.toLowerCase() || '';
          return time.includes('day') || time.includes('week');
        },
      },
    ],
  },
];

// Enhanced opportunity filters hook
const useOpportunityFilters = (opportunities: Opportunity[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'value' | 'regions' | 'date'>('value');
  const [selectedSmartFilters, setSelectedSmartFilters] = useState<string[]>([]);

  // Get unique banks from valid opportunities
  const availableBanks = Array.from(
    new Set(
      opportunities.filter((opp) => opp && opp.id && opp.bank).map((opp) => opp.bank)
    )
  ).sort();

  const getFilteredAndSortedOpportunities = () => {
    // First filter out any invalid opportunities
    let filtered = opportunities.filter((opp) => opp && opp.id);

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (opp) =>
          (opp.title || '').toLowerCase().includes(searchLower) ||
          (opp.bank || '').toLowerCase().includes(searchLower) ||
          (opp.description || '').toLowerCase().includes(searchLower) ||
          (opp.requirements || []).some((req) =>
            req.toLowerCase().includes(searchLower)
          ) ||
          (opp.metadata?.availability?.regions || '').toLowerCase().includes(searchLower)
      );
    }

    // Apply bank filter
    if (selectedBank) {
      filtered = filtered.filter((opp) => opp.bank === selectedBank);
    }

    // Apply quick filters
    if (activeFilter) {
      const quickFilter = QUICK_FILTERS.find((f) => f.id === activeFilter);
      if (quickFilter?.filter) {
        filtered = filtered.filter(quickFilter.filter);
      }
    }

    // Apply smart filters
    if (selectedSmartFilters.length > 0) {
      const activeFilters = FILTER_GROUPS.flatMap((group) => group.filters).filter(
        (filter) => selectedSmartFilters.includes(filter.id)
      );

      filtered = filtered.filter((opp) =>
        activeFilters.every((filter) => filter.filter(opp))
      );
    }

    // Apply sorting with null checks
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'value':
          return (b.value || 0) - (a.value || 0);
        case 'regions':
          return (a.metadata?.availability?.regions || 'Unknown').localeCompare(
            b.metadata?.availability?.regions || 'Unknown'
          );
        case 'date':
          return (
            new Date(b.postedDate || 0).getTime() - new Date(a.postedDate || 0).getTime()
          );
        default:
          return 0;
      }
    });
  };

  const filteredOpportunities = getFilteredAndSortedOpportunities();

  // Calculate statistics for the filtered results
  const stats = {
    total: filteredOpportunities.length,
    averageValue: Math.round(
      filteredOpportunities.reduce((sum, opp) => sum + (opp.value || 0), 0) /
        filteredOpportunities.length
    ),
    byType: {
      credit_card: filteredOpportunities.filter((opp) => opp.type === 'credit_card')
        .length,
      bank_account: filteredOpportunities.filter((opp) => opp.type === 'bank_account')
        .length,
      brokerage: filteredOpportunities.filter((opp) => opp.type === 'brokerage').length,
    },
    highValue: filteredOpportunities.filter((opp) => opp.value >= 500).length,
  };

  return {
    searchTerm,
    setSearchTerm,
    activeFilter,
    setActiveFilter,
    selectedBank,
    setSelectedBank,
    availableBanks,
    sortBy,
    setSortBy,
    selectedSmartFilters,
    setSelectedSmartFilters,
    filteredOpportunities,
    stats,
  };
};

// Add BankFilter component
const BankFilter = ({
  banks,
  selectedBank,
  onBankChange,
}: {
  banks: string[];
  selectedBank: string | null;
  onBankChange: (bank: string | null) => void;
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <>
      <Button
        size="small"
        variant={selectedBank ? 'contained' : 'outlined'}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        startIcon={<AccountBalanceIcon />}
        endIcon={<ExpandMoreIcon />}
        sx={{
          textTransform: 'none',
          minWidth: 120,
          bgcolor: selectedBank ? 'primary.main' : 'transparent',
        }}
      >
        {selectedBank || 'All Banks'}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            maxHeight: 300,
            width: 200,
          },
        }}
      >
        <MenuItem
          onClick={() => {
            onBankChange(null);
            setAnchorEl(null);
          }}
          selected={!selectedBank}
        >
          <Typography variant="body2">All Banks</Typography>
        </MenuItem>
        <Divider />
        {banks.map((bank) => (
          <MenuItem
            key={bank}
            onClick={() => {
              onBankChange(bank);
              setAnchorEl(null);
            }}
            selected={bank === selectedBank}
          >
            <Typography variant="body2">{bank}</Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

// New components for better organization
const QuickFilters = ({
  activeFilter,
  onFilterChange,
}: {
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      display="flex"
      gap={2}
      sx={{
        overflowX: 'auto',
        pb: 1,
        '&::-webkit-scrollbar': {
          height: 6,
        },
        '&::-webkit-scrollbar-track': {
          bgcolor: isDark
            ? alpha(theme.palette.background.paper, 0.2)
            : alpha(theme.palette.primary.main, 0.05),
          borderRadius: 3,
        },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: isDark
            ? alpha(theme.palette.primary.main, 0.3)
            : alpha(theme.palette.primary.main, 0.2),
          borderRadius: 3,
          '&:hover': {
            bgcolor: isDark
              ? alpha(theme.palette.primary.main, 0.4)
              : alpha(theme.palette.primary.main, 0.3),
          },
        },
      }}
    >
      {QUICK_FILTERS.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;

        return (
          <Box
            key={`filter-${filter.id}`}
            onClick={() => onFilterChange(isActive ? null : filter.id)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              py: 1,
              px: 2,
              borderRadius: 2,
              cursor: 'pointer',
              bgcolor: isActive
                ? isDark
                  ? alpha(theme.palette.primary.main, 0.25)
                  : alpha(theme.palette.primary.main, 0.1)
                : isDark
                  ? alpha(theme.palette.background.paper, 0.3)
                  : alpha(theme.palette.primary.main, 0.05),
              color: isActive ? filter.color : isDark ? 'text.primary' : 'text.secondary',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: isActive
                  ? isDark
                    ? alpha(theme.palette.primary.main, 0.35)
                    : alpha(theme.palette.primary.main, 0.15)
                  : isDark
                    ? alpha(theme.palette.background.paper, 0.4)
                    : alpha(theme.palette.primary.main, 0.08),
              },
              minWidth: 'fit-content',
              border: '1px solid',
              borderColor: isActive
                ? isDark
                  ? alpha(filter.color, 0.5)
                  : filter.color
                : 'transparent',
            }}
          >
            <Icon fontSize="small" />
            <Typography
              variant="body2"
              fontWeight={isActive ? 'medium' : 'regular'}
              sx={{
                color: isDark ? 'text.primary' : 'inherit',
              }}
            >
              {filter.label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
};

// Add SearchBar component
const SearchBar = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const theme = useTheme();

  return (
    <TextField
      placeholder="Search opportunities..."
      size="small"
      fullWidth
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{
        '& .MuiOutlinedInput-root': {
          bgcolor:
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.6)
              : alpha(theme.palette.background.paper, 0.8),
          borderRadius: 1,
        },
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: 'text.secondary' }} />
          </InputAdornment>
        ),
      }}
    />
  );
};

// Update the OpportunitiesHeader component to show collection status
interface OpportunitiesHeaderProps {
  total: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: 'value' | 'regions' | 'date') => void;
  selectedBank: string | null;
  onBankChange: (bank: string | null) => void;
  availableBanks: string[];
  isCollecting: boolean;
}

const OpportunitiesHeader: React.FC<OpportunitiesHeaderProps> = ({
  total,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  selectedBank,
  onBankChange,
  availableBanks,
  isCollecting,
}) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const handleFilterClick = (filterId: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filterId) ? prev.filter((id) => id !== filterId) : [...prev, filterId]
    );
  };

  return (
    <Box sx={{ mb: 4 }}>
      {/* Header Title and Stats */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              mb: 1,
            }}
          >
            Available Opportunities
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <AssignmentTurnedIn fontSize="small" />
              {total} opportunities available
            </Typography>
            {isCollecting && (
              <Chip
                size="small"
                icon={<RefreshIcon />}
                label="Updating..."
                color="primary"
                variant="outlined"
                sx={{
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.6 },
                    '100%': { opacity: 1 },
                  },
                }}
              />
            )}
          </Box>
        </Box>

        {/* Action Buttons */}
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            startIcon={<TuneIcon />}
            sx={{
              textTransform: 'none',
              borderColor: selectedFilters.length > 0 ? 'primary.main' : 'divider',
              color: selectedFilters.length > 0 ? 'primary.main' : 'text.primary',
            }}
          >
            Filters
            {selectedFilters.length > 0 && (
              <Chip
                size="small"
                label={selectedFilters.length}
                color="primary"
                sx={{ ml: 1 }}
              />
            )}
          </Button>

          <BankFilter
            banks={availableBanks}
            selectedBank={selectedBank}
            onBankChange={onBankChange}
          />

          <Box
            sx={{
              display: 'flex',
              gap: 1,
              p: 0.5,
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              borderRadius: 1,
            }}
          >
            {['value', 'regions', 'date'].map((option) => (
              <Button
                key={option}
                size="small"
                variant={sortBy === option ? 'contained' : 'text'}
                onClick={() => onSortChange(option as 'value' | 'regions' | 'date')}
                sx={{
                  minWidth: 'auto',
                  px: 2,
                  textTransform: 'none',
                  color: sortBy === option ? 'white' : 'text.primary',
                  '&:hover': {
                    bgcolor:
                      sortBy === option
                        ? theme.palette.primary.dark
                        : alpha(theme.palette.primary.main, 0.1),
                  },
                }}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Button>
            ))}
          </Box>
        </Stack>
      </Box>

      {/* Search Bar */}
      <Box sx={{ maxWidth: 600 }}>
        <SearchBar value={searchTerm} onChange={onSearchChange} />
      </Box>

      {/* Smart Filters Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1,
            minWidth: 320,
            maxHeight: 480,
            overflow: 'auto',
          },
        }}
      >
        {FILTER_GROUPS.map((group) => (
          <Box key={group.label}>
            <Typography
              variant="overline"
              sx={{
                px: 2,
                py: 1,
                display: 'block',
                color: 'text.secondary',
                bgcolor: 'background.default',
              }}
            >
              {group.label}
            </Typography>
            {group.filters.map((filter) => {
              const Icon = filter.icon;
              const isSelected = selectedFilters.includes(filter.id);
              return (
                <MenuItem
                  key={filter.id}
                  onClick={() => handleFilterClick(filter.id)}
                  sx={{
                    py: 1,
                    px: 2,
                    borderLeft: 2,
                    borderColor: isSelected ? filter.color : 'transparent',
                    '&:hover': {
                      bgcolor: alpha(filter.color, 0.1),
                    },
                  }}
                >
                  <ListItemIcon>
                    <Icon sx={{ color: isSelected ? filter.color : 'text.secondary' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={filter.label}
                    sx={{
                      '& .MuiTypography-root': {
                        color: isSelected ? filter.color : 'text.primary',
                        fontWeight: isSelected ? 500 : 400,
                      },
                    }}
                  />
                  {isSelected && (
                    <CheckIcon fontSize="small" sx={{ color: filter.color }} />
                  )}
                </MenuItem>
              );
            })}
            <Divider />
          </Box>
        ))}
      </Menu>
    </Box>
  );
};

const OpportunityCard = ({ opportunity }: { opportunity: Opportunity }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const isDark = theme.palette.mode === 'dark';

  const getHighlightColor = (type: string) => {
    switch (type) {
      case 'positive':
        return theme.palette.success.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'info':
        return theme.palette.info.main;
      default:
        return theme.palette.text.primary;
    }
  };

  const getHighlights = () =>
    [
      {
        icon: MonetizationOnIcon,
        label: 'Bonus Value',
        value: `$${opportunity.value.toLocaleString()}`,
        type: 'positive',
      },
      opportunity.type === 'credit_card' && opportunity.metadata.credit?.inquiry
        ? {
            icon: CreditScoreIcon,
            label: 'Credit Check',
            value: opportunity.metadata.credit.inquiry,
            type: opportunity.metadata.credit.inquiry.toLowerCase().includes('soft')
              ? 'positive'
              : 'warning',
          }
        : null,
      opportunity.metadata.availability?.regions
        ? {
            icon: PublicIcon,
            label: 'Availability',
            value: opportunity.metadata.availability.regions
              .toLowerCase()
              .includes('nationwide')
              ? 'Nationwide'
              : 'Regional',
            type: opportunity.metadata.availability.regions
              .toLowerCase()
              .includes('nationwide')
              ? 'positive'
              : 'info',
          }
        : null,
    ].filter(
      (
        item
      ): item is {
        icon: typeof MonetizationOnIcon;
        label: string;
        value: string;
        type: string;
      } => item !== null
    );

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2,
        bgcolor: isDark ? alpha(theme.palette.background.paper, 0.6) : 'background.paper',
        border: '1px solid',
        borderColor: expanded ? 'primary.main' : 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-2px)',
          boxShadow: 1,
        },
      }}
    >
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          p: 3,
          cursor: 'pointer',
        }}
      >
        {/* Header */}
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {opportunity.type === 'credit_card' ? (
              <CreditCardIcon sx={{ fontSize: '1.5rem' }} />
            ) : opportunity.type === 'brokerage' ? (
              <AccountBalanceWalletIcon sx={{ fontSize: '1.5rem' }} />
            ) : (
              <AccountBalanceIcon sx={{ fontSize: '1.5rem' }} />
            )}
          </Box>
          <Box flex={1}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
              {opportunity.title}
            </Typography>
            <Chip
              size="small"
              label={opportunity.bank}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                fontWeight: 500,
              }}
            />
          </Box>
        </Box>

        {/* Highlights */}
        <Box display="flex" gap={2}>
          {getHighlights().map((highlight, index) => {
            const Icon = highlight.icon;
            const color = getHighlightColor(highlight.type);
            return (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  py: 1.5,
                  px: 2,
                  borderRadius: 1,
                  bgcolor: alpha(color, 0.1),
                  flex: 1,
                }}
              >
                <Icon sx={{ color, fontSize: '1.25rem' }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {highlight.label}
                  </Typography>
                  <Typography variant="body2" color={color} fontWeight="600">
                    {highlight.value}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Divider />
        <Box p={3} bgcolor={alpha(theme.palette.background.default, 0.5)}>
          <Typography variant="body2" color="text.secondary" paragraph>
            {opportunity.description}
          </Typography>
          {opportunity.requirements.length > 0 && (
            <>
              <Typography
                variant="subtitle2"
                color="primary"
                gutterBottom
                sx={{ mt: 2, fontWeight: 600 }}
              >
                Requirements
              </Typography>
              <Box
                component="ul"
                sx={{
                  m: 0,
                  pl: 2,
                  listStyle: 'none',
                  '& li': {
                    position: 'relative',
                    '&::before': {
                      content: '"•"',
                      position: 'absolute',
                      left: -16,
                      color: theme.palette.primary.main,
                    },
                  },
                }}
              >
                {opportunity.requirements.map((req, index) => (
                  <Typography
                    component="li"
                    key={index}
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {req}
                  </Typography>
                ))}
              </Box>
            </>
          )}
          <Box mt={2}>
            <Link
              href={`/opportunities/${opportunity.id}`}
              passHref
              style={{ textDecoration: 'none' }}
            >
              <Button variant="contained" color="primary" fullWidth>
                View Details
              </Button>
            </Link>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

function OpportunitiesSection() {
  const { opportunities, isLoading: loading, error, isCollecting } = useOpportunities();
  const {
    searchTerm,
    setSearchTerm,
    activeFilter,
    setActiveFilter,
    selectedBank,
    setSelectedBank,
    availableBanks,
    sortBy,
    setSortBy,
    filteredOpportunities,
  } = useOpportunityFilters(opportunities);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography color="error" gutterBottom>
          {error.message}
        </Typography>
        <Button
          variant="outlined"
          onClick={() => window.location.reload()}
          startIcon={<RefreshIcon />}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <OpportunitiesHeader
        total={opportunities.length}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        sortBy={sortBy}
        onSortChange={setSortBy}
        selectedBank={selectedBank}
        onBankChange={setSelectedBank}
        availableBanks={availableBanks}
        isCollecting={isCollecting}
      />

      <QuickFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />

      {filteredOpportunities.length === 0 ? (
        <Alert
          severity="info"
          sx={{
            mt: 3,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          No opportunities found. Try different search terms or filters.
        </Alert>
      ) : (
        <Box mt={3}>
          {filteredOpportunities.map((opportunity) => (
            <OpportunityCard
              key={`opportunity-${opportunity.id}`}
              opportunity={opportunity}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

export default function OpportunitiesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh',
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <OpportunitiesSection />
    </div>
  );
}

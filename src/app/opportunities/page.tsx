'use client';

import {
  AccountBalance as AccountBalanceIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  AssignmentTurnedIn,
  AttachMoney as AttachMoneyIcon,
  Block as BlockIcon,
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
  Verified as VerifiedIcon,
  ArrowForward as ArrowForwardIcon,
  GridView as GridViewIcon,
  ViewList as ViewListIcon,
  LocationOn as LocationOnIcon,
} from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Theme, useTheme } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import React from 'react';

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
    id: 'bank',
    label: 'Bank Accounts',
    icon: AccountBalanceIcon,
    color: '#2e7d32',
    filter: (opp: Opportunity) => opp.type === 'bank',
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
    filter: (opp: Opportunity) => {
      const bonusDesc = opp.bonus?.description?.toLowerCase() || '';
      return (
        bonusDesc.includes('single') ||
        bonusDesc.includes('one time') ||
        bonusDesc.includes('first')
      );
    },
  },
  {
    id: 'nationwide',
    label: 'Nationwide',
    icon: PublicIcon,
    color: '#388e3c',
    filter: (opp: Opportunity) => opp.metadata.availability?.type === 'Nationwide',
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

// Add a helper function to check if availability data is valid

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
          Boolean(
            opp.metadata.bonus?.requirements?.description
              ?.toLowerCase()
              .includes('direct deposit')
          ),
      },
      {
        id: 'no_direct_deposit',
        label: 'No DD Required',
        icon: BlockIcon,
        color: '#d32f2f',
        filter: (opp: Opportunity) =>
          !Boolean(
            opp.metadata.bonus?.requirements?.description
              ?.toLowerCase()
              .includes('direct deposit')
          ),
      },
      {
        id: 'low_spend',
        label: 'Low Spend',
        icon: ShoppingCartIcon,
        color: '#388e3c',
        filter: (opp: Opportunity) => {
          const req = opp.metadata.bonus?.requirements?.description || '';
          const spendMatch = req.match(/\$(\d+)/);
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
          opp.details?.credit_inquiry?.toLowerCase().includes('soft') || false,
      },
      {
        id: 'no_524',
        label: 'No 5/24 Impact',
        icon: CheckCircleIcon,
        color: '#1976d2',
        filter: (opp: Opportunity) =>
          opp.type === 'credit_card' && opp.details?.under_5_24 === 'No',
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
        filter: (opp: Opportunity) => {
          if (opp.type !== 'credit_card' || !opp.details?.annual_fees) {
            return false;
          }
          const feesLower = opp.details.annual_fees.toLowerCase();
          return feesLower.includes('none') || feesLower.includes('no');
        },
      },
      {
        id: 'no_monthly_fee',
        label: 'No Monthly Fee',
        icon: PaymentsIcon,
        color: '#2e7d32',
        filter: (opp: Opportunity) =>
          (opp.type === 'bank' || opp.type === 'brokerage') &&
          !!opp.details?.monthly_fees?.amount?.toLowerCase().includes('none'),
      },
      {
        id: 'no_foreign_transaction',
        label: 'No Foreign Transaction',
        icon: PublicIcon,
        color: '#0288d1',
        filter: (opp: Opportunity) => {
          if (opp.type !== 'credit_card' || !opp.details?.foreign_transaction_fees) {
            return false;
          }
          const feesLower = opp.details.foreign_transaction_fees.toLowerCase();
          return feesLower.includes('none') || feesLower.includes('no');
        },
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
        filter: (opp: Opportunity) => opp.metadata.availability?.type === 'Nationwide',
      },
      {
        id: 'no_restrictions',
        label: 'No Restrictions',
        icon: VerifiedIcon,
        color: '#0288d1',
        filter: (opp: Opportunity) => !opp.metadata.availability?.details,
      },
      {
        id: 'multi_state',
        label: 'Multiple States',
        icon: CheckCircleIcon,
        color: '#0288d1',
        filter: (opp: Opportunity) =>
          Array.isArray(opp.metadata.availability?.states) &&
          opp.metadata.availability.states.length > 1,
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
          opp.bonus?.additional_info?.toLowerCase().includes('instant approval') ||
          opp.bonus?.additional_info?.toLowerCase().includes('same day') ||
          false,
      },
      {
        id: 'fast_bonus',
        label: 'Fast Bonus Posting',
        icon: MonetizationOnIcon,
        color: '#2e7d32',
        filter: (opp: Opportunity) => {
          const info = opp.bonus?.additional_info?.toLowerCase() || '';
          return (
            info.includes('bonus posts') &&
            (info.includes('day') || info.includes('week'))
          );
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
          (Array.isArray(opp.metadata?.availability?.regions) &&
            opp.metadata.availability.regions.some((r: string) =>
              r.toLowerCase().includes(searchLower)
            ))
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
          const aRegions = Array.isArray(a.metadata?.availability?.regions)
            ? a.metadata.availability.regions.join(', ')
            : 'Unknown';
          const bRegions = Array.isArray(b.metadata?.availability?.regions)
            ? b.metadata.availability.regions.join(', ')
            : 'Unknown';
          return aRegions.localeCompare(bRegions);
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
      bank: filteredOpportunities.filter((opp) => opp.type === 'bank').length,
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
  viewMode,
  onViewModeChange,
}: {
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
  viewMode: 'grid' | 'cards';
  onViewModeChange: (mode: 'grid' | 'cards') => void;
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mb: 3,
        height: 40,
      }}
    >
      <Box
        display="flex"
        gap={1}
        sx={{
          flex: 1,
          overflowX: 'auto',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        {QUICK_FILTERS.map((filter, index) => (
          <Box
            key={`filter-${filter.id}`}
            onClick={() => onFilterChange(activeFilter === filter.id ? null : filter.id)}
            onMouseEnter={() => setHoveredFilter(filter.id)}
            onMouseLeave={() => setHoveredFilter(null)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              py: 1,
              px: 1.5,
              height: 40,
              borderRadius: 2,
              cursor: 'pointer',
              bgcolor:
                activeFilter === filter.id
                  ? isDark
                    ? alpha(theme.palette.primary.main, 0.25)
                    : alpha(theme.palette.primary.main, 0.1)
                  : isDark
                    ? alpha(theme.palette.background.paper, 0.3)
                    : alpha(theme.palette.primary.main, 0.05),
              color:
                activeFilter === filter.id
                  ? filter.color
                  : isDark
                    ? 'text.primary'
                    : 'text.secondary',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              transform:
                hoveredFilter === filter.id ? 'translateY(-2px)' : 'translateY(0)',
              position: 'relative',
              overflow: 'hidden',
              animation: `slideIn 0.5s ease ${index * 0.1}s both`,
              '@keyframes slideIn': {
                '0%': {
                  opacity: 0,
                  transform: 'translateY(10px)',
                },
                '100%': {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              },
              '&:hover': {
                bgcolor:
                  activeFilter === filter.id
                    ? isDark
                      ? alpha(theme.palette.primary.main, 0.35)
                      : alpha(theme.palette.primary.main, 0.15)
                    : isDark
                      ? alpha(theme.palette.background.paper, 0.4)
                      : alpha(theme.palette.primary.main, 0.08),
              },
              border: '1px solid',
              borderColor:
                activeFilter === filter.id
                  ? isDark
                    ? alpha(filter.color, 0.5)
                    : filter.color
                  : 'transparent',
              minWidth: 'fit-content',
            }}
          >
            <filter.icon
              sx={{
                fontSize: '1.1rem',
                transition: 'transform 0.2s ease',
                transform: hoveredFilter === filter.id ? 'scale(1.1)' : 'scale(1)',
              }}
            />
            <Typography
              variant="body2"
              sx={{
                fontWeight: activeFilter === filter.id ? 600 : 500,
                fontSize: '0.875rem',
                color:
                  activeFilter === filter.id
                    ? filter.color
                    : isDark
                      ? 'text.primary'
                      : 'inherit',
                transition: 'transform 0.2s ease',
                transform:
                  hoveredFilter === filter.id ? 'translateX(2px)' : 'translateX(0)',
              }}
            >
              {filter.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* View Toggle */}
      <Box
        sx={{
          display: 'flex',
          gap: 0.5,
          p: 0.5,
          height: 40,
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          borderRadius: '8px',
          border: '1px solid',
          borderColor: alpha(theme.palette.primary.main, 0.1),
          flexShrink: 0,
        }}
      >
        <IconButton
          size="small"
          onClick={() => onViewModeChange('grid')}
          sx={{
            width: 32,
            height: '100%',
            bgcolor:
              viewMode === 'grid'
                ? alpha(theme.palette.primary.main, 0.1)
                : 'transparent',
            color:
              viewMode === 'grid'
                ? theme.palette.primary.main
                : theme.palette.text.secondary,
            '&:hover': {
              bgcolor:
                viewMode === 'grid'
                  ? alpha(theme.palette.primary.main, 0.15)
                  : alpha(theme.palette.primary.main, 0.07),
            },
          }}
        >
          <ViewListIcon sx={{ fontSize: '1.1rem' }} />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => onViewModeChange('cards')}
          sx={{
            width: 32,
            height: '100%',
            bgcolor:
              viewMode === 'cards'
                ? alpha(theme.palette.primary.main, 0.1)
                : 'transparent',
            color:
              viewMode === 'cards'
                ? theme.palette.primary.main
                : theme.palette.text.secondary,
            '&:hover': {
              bgcolor:
                viewMode === 'cards'
                  ? alpha(theme.palette.primary.main, 0.15)
                  : alpha(theme.palette.primary.main, 0.07),
            },
          }}
        >
          <GridViewIcon sx={{ fontSize: '1.1rem' }} />
        </IconButton>
      </Box>
    </Box>
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
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <Box sx={{ mb: 3 }}>
      {/* Header Title and Search Row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          mb: 2,
        }}
      >
        {/* Title and Stats */}
        <Box flex="0 0 auto">
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              mb: 0.5,
            }}
          >
            Available Opportunities
          </Typography>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <AssignmentTurnedIn
                sx={{
                  fontSize: '0.9rem',
                  color: theme.palette.primary.main,
                  animation: isCollecting ? 'spin 2s linear infinite' : 'none',
                }}
              />
              {total} opportunities available
            </Typography>
            {isCollecting && (
              <Chip
                size="small"
                icon={<RefreshIcon sx={{ fontSize: '0.8rem' }} />}
                label="Updating..."
                sx={{
                  height: '20px',
                  '& .MuiChip-label': {
                    fontSize: '0.65rem',
                    px: 1,
                  },
                }}
              />
            )}
          </Box>
        </Box>

        {/* Search Bar */}
        <Box
          sx={{
            flex: 1,
            maxWidth: '400px',
            transform: isSearchFocused ? 'scale(1.01)' : 'scale(1)',
            transition: 'all 0.2s ease',
          }}
        >
          <TextField
            placeholder="Search opportunities..."
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            sx={{
              '& .MuiOutlinedInput-root': {
                height: '36px',
                bgcolor:
                  theme.palette.mode === 'dark'
                    ? alpha(theme.palette.background.paper, 0.6)
                    : alpha(theme.palette.background.paper, 0.8),
                borderRadius: '8px',
                fontSize: '0.875rem',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: '1.1rem' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Action Buttons */}
        <Stack direction="row" spacing={1} flex="0 0 auto">
          <BankFilter
            banks={availableBanks}
            selectedBank={selectedBank}
            onBankChange={onBankChange}
          />

          <Box
            sx={{
              height: '36px',
              display: 'flex',
              gap: 0.5,
              p: 0.5,
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              borderRadius: '8px',
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
                  px: 1.5,
                  fontSize: '0.75rem',
                  height: '28px',
                }}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Button>
            ))}
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

const getOpportunityStyles = (type: string, theme: Theme) => {
  switch (type) {
    case 'credit_card':
      return {
        gradientColors: `${theme.palette.primary.main}, ${theme.palette.secondary.main}`,
        icon: CreditCardIcon,
        chipBgColor: alpha(theme.palette.primary.main, 0.1),
        chipColor: theme.palette.primary.main,
      };
    case 'bank':
      return {
        gradientColors: `${theme.palette.info.main}, ${theme.palette.info.dark}`,
        icon: AccountBalanceIcon,
        chipBgColor: alpha(theme.palette.info.main, 0.1),
        chipColor: theme.palette.info.main,
      };
    case 'brokerage':
      return {
        gradientColors: `${theme.palette.success.main}, ${theme.palette.success.dark}`,
        icon: AccountBalanceWalletIcon,
        chipBgColor: alpha(theme.palette.success.main, 0.1),
        chipColor: theme.palette.success.main,
      };
    default:
      return {
        gradientColors: `${theme.palette.primary.main}, ${theme.palette.secondary.main}`,
        icon: MonetizationOnIcon,
        chipBgColor: alpha(theme.palette.primary.main, 0.1),
        chipColor: theme.palette.primary.main,
      };
  }
};

// Helper functions for formatting data
const summarizeRequirements = (opportunity: Opportunity) => {
  const requirements = opportunity.bonus?.requirements;
  if (!requirements?.length || !requirements[0]?.description) {
    return 'View offer details';
  }
  
  const req = requirements[0].description;

  // Handle spending requirements
  if (req.toLowerCase().includes('spend')) {
    const amount = req.match(/\$[\d,]+/)?.[0];
    const months = req.match(/(\d+)\s*months?/)?.[1];
    if (amount && months) {
      return `Spend ${amount} in ${months} months`;
    }
  }

  // Handle direct deposit requirements
  if (req.toLowerCase().includes('direct deposit')) {
    const amount = req.match(/\$[\d,]+/)?.[0];
    if (amount) {
      return `Direct deposit of ${amount}`;
    }
  }

  // If it's a long requirement, truncate it
  if (req.length > 100) {
    return req.substring(0, 97) + '...';
  }

  return req;
};

// State Management Constants & Types
const STATE_DISPLAY_CONFIG = {
  CHIP_MIN_WIDTH: 45,
  ANIMATION_DURATION: 200,
  MAX_VISIBLE_STATES: 8,
} as const;

interface StateDisplayProps {
  states: string[];
  showFull?: boolean;
  maxVisible?: number;
  className?: string;
}

// Memoized state name mapping
const STATE_NAMES = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
  DC: 'District of Columbia',
  PR: 'Puerto Rico',
  VI: 'U.S. Virgin Islands',
} as const;

type StateCode = keyof typeof STATE_NAMES;

// Optimized state validation with memoization
const validateStateCode = (state: string): StateCode | null => {
  const code = state.toUpperCase().trim() as StateCode;
  if (code in STATE_NAMES) return code;

  const stateEntry = Object.entries(STATE_NAMES).find(
    ([, name]) => name.toLowerCase() === state.toLowerCase().trim()
  );
  return stateEntry ? (stateEntry[0] as StateCode) : null;
};

// Modern React component with animations and optimizations
const SmartStateChip = React.memo(
  ({ state, showFull = false }: { state: string; showFull?: boolean }) => {
    const theme = useTheme();
    const validState = validateStateCode(state);

    if (!validState) return null;

    const displayName = STATE_NAMES[validState];
    const label = showFull ? displayName : validState;

    return (
      <Tooltip
        title={showFull ? null : displayName}
        arrow
        placement="top"
        enterDelay={400}
        leaveDelay={200}
      >
        <Chip
          label={label}
          size="small"
          component={motion.div}
          whileHover={{ y: -2, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          sx={{
            minWidth: showFull ? 'auto' : STATE_DISPLAY_CONFIG.CHIP_MIN_WIDTH,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: 'primary.main',
            fontWeight: 600,
            backdropFilter: 'blur(8px)',
            transition: theme.transitions.create(
              ['background-color', 'box-shadow', 'transform'],
              { duration: STATE_DISPLAY_CONFIG.ANIMATION_DURATION }
            ),
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.15),
              boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
            },
          }}
        />
      </Tooltip>
    );
  }
);

SmartStateChip.displayName = 'SmartStateChip';

// Optimized state display component with virtualization for large lists
const StateDisplay = React.memo(
  ({
    states,
    showFull = false,
    maxVisible = STATE_DISPLAY_CONFIG.MAX_VISIBLE_STATES,
  }: StateDisplayProps) => {
    const [showAll, setShowAll] = useState(false);
    const theme = useTheme();

    const validStates = useMemo(
      () =>
        Array.from(new Set(states))
          .map(validateStateCode)
          .filter((code): code is StateCode => code !== null),
      [states]
    );

    const displayStates = showAll ? validStates : validStates.slice(0, maxVisible);
    const hasMore = validStates.length > maxVisible;

    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
        {displayStates.map((state) => (
          <SmartStateChip key={state} state={state} showFull={showFull} />
        ))}
        {hasMore && !showAll && (
          <Chip
            label={`+${validStates.length - maxVisible} more`}
            size="small"
            onClick={() => setShowAll(true)}
            sx={{
              cursor: 'pointer',
              bgcolor: alpha(theme.palette.secondary.main, 0.1),
              color: 'secondary.main',
              '&:hover': {
                bgcolor: alpha(theme.palette.secondary.main, 0.2),
              },
            }}
          />
        )}
      </Box>
    );
  }
);

StateDisplay.displayName = 'StateDisplay';

// Update the availability display in the opportunity card
const renderAvailability = (availability?: {
  type: 'Nationwide' | 'State';
  states?: string[];
  details?: string;
}) => {
  if (!availability) return null;

  if (availability.type === 'Nationwide') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <PublicIcon
          sx={{
            fontSize: '1rem',
            color: 'primary.main',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': { opacity: 0.6 },
              '50%': { opacity: 1 },
              '100%': { opacity: 0.6 },
            },
          }}
        />
        <Typography variant="body2">Nationwide</Typography>
      </Box>
    );
  }

  if (Array.isArray(availability.states) && availability.states.length > 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <LocationOnIcon sx={{ fontSize: '1rem', color: 'primary.main' }} />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {availability.states.length}{' '}
            {availability.states.length === 1 ? 'state' : 'states'}
          </Typography>
        </Box>
        <StateDisplay states={availability.states} />
      </Box>
    );
  }

  return null;
};

const OpportunityCard = ({ opportunity }: { opportunity: Opportunity }) => {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const isDark = theme.palette.mode === 'dark';
  const styles = getOpportunityStyles(opportunity.type, theme);

  // Use the same standardization function as the grid view
  const standardizedData = standardizeOpportunityForGrid(opportunity);
  const showFeeOrCredit =
    opportunity.type === 'credit_card' || standardizedData.fee !== 'None';
  const feeOrCreditText =
    opportunity.type === 'credit_card' ? standardizedData.fee : standardizedData.fee;

  return (
    <Paper
      elevation={0}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isDark ? alpha(theme.palette.background.paper, 0.6) : 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 12px 24px ${alpha(theme.palette.common.black, 0.12)}`,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isDark
              ? `linear-gradient(135deg, ${alpha(styles.chipColor, 0.2)}, ${alpha(styles.chipColor, 0.1)})`
              : `linear-gradient(135deg, ${alpha(styles.chipColor, 0.15)}, ${alpha(styles.chipColor, 0.05)})`,
          }}
        >
          <styles.icon sx={{ fontSize: '1.25rem', color: styles.chipColor }} />
        </Box>
        <Box flex={1}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              fontSize: '0.95rem',
              lineHeight: 1.2,
            }}
          >
            {opportunity.title.split('-')[0].trim()}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              display: 'block',
              mt: 0.5,
            }}
          >
            {opportunity.type === 'credit_card'
              ? 'Credit Card'
              : opportunity.type === 'bank'
                ? 'Bank Account'
                : 'Brokerage Account'}
          </Typography>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Bonus */}
        <Box sx={{ mb: 2.5 }}>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.success.main,
              fontWeight: 600,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'block',
              mb: 0.5,
            }}
          >
            BONUS
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: theme.palette.success.main,
              fontWeight: 700,
              fontSize: '1.5rem',
            }}
          >
            ${opportunity.value.toLocaleString()}
          </Typography>
        </Box>

        {/* Requirements */}
        <Box sx={{ mb: 2.5 }}>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.info.main,
              fontWeight: 600,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'block',
              mb: 0.5,
            }}
          >
            HOW TO GET
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.primary',
              fontWeight: 500,
              fontSize: '0.875rem',
              lineHeight: 1.4,
            }}
          >
            {summarizeRequirements(opportunity)}
          </Typography>
        </Box>

        {/* Credit Check for Credit Cards */}
        {opportunity.type === 'credit_card' && (
          <Box sx={{ mb: 2.5 }}>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.warning.main,
                fontWeight: 600,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'block',
                mb: 0.5,
              }}
            >
              CREDIT CHECK
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.primary',
                fontWeight: 500,
                fontSize: '0.875rem',
              }}
            >
              {standardizedData.creditCheck}
            </Typography>
          </Box>
        )}

        {/* Fee Display */}
        {showFeeOrCredit && (
          <Box sx={{ mb: 2.5 }}>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.warning.main,
                fontWeight: 600,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'block',
                mb: 0.5,
              }}
            >
              {opportunity.type === 'credit_card' ? 'ANNUAL FEE' : 'FEE'}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.primary',
                fontWeight: 500,
                fontSize: '0.875rem',
              }}
            >
              {feeOrCreditText}
            </Typography>
          </Box>
        )}

        {/* Availability */}
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            display: 'block',
            mb: 2.5,
          }}
        >
          {renderAvailability(opportunity.metadata?.availability)}
        </Typography>

        {/* Actions */}
        <Box
          sx={{
            mt: 'auto',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 1,
          }}
        >
          <Link
            href={`/opportunities/${opportunity.id}`}
            passHref
            style={{ textDecoration: 'none' }}
          >
            <Button
              variant="contained"
              fullWidth
              sx={{
                py: 1.25,
                background: `linear-gradient(45deg, ${styles.gradientColors})`,
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: isHovered
                  ? `0 8px 16px ${alpha(styles.chipColor, 0.25)}`
                  : 'none',
                '&:hover': {
                  background: `linear-gradient(45deg, ${styles.gradientColors})`,
                  filter: 'brightness(1.1)',
                },
              }}
            >
              View Offer
              <ArrowForwardIcon sx={{ ml: 1, fontSize: '0.9rem' }} />
            </Button>
          </Link>
        </Box>
      </Box>
    </Paper>
  );
};

// Add this function before the OpportunitiesSection component
const standardizeOpportunityForGrid = (opp: Opportunity) => {
  let feeText = 'None';
  const details = opp.details;

  if (opp.type === 'credit_card' && details?.annual_fees) {
    feeText = details.annual_fees;
  } else if (details?.monthly_fees?.amount) {
    feeText = details.monthly_fees.amount;
    if (details.monthly_fees.waiver_details) {
      feeText += ` (${details.monthly_fees.waiver_details})`;
    }
  }

  // Format regions for display
  let availabilityText = 'Unknown';
  if (details?.availability?.type === 'Nationwide') {
    availabilityText = 'Nationwide';
  } else if (details?.availability?.states) {
    availabilityText = details.availability.states.join(', ');
  }

  return {
    id: opp.id,
    title: opp.name,
    value: `$${opp.value.toLocaleString()}`,
    type:
      opp.type === 'credit_card'
        ? 'Credit Card'
        : opp.type === 'bank'
          ? 'Bank Account'
          : 'Brokerage',
    creditCheck: details?.credit_inquiry || 'Unknown',
    fee: feeText,
    requirements: opp.bonus?.requirements?.[0]?.description || 'View offer details',
    availability: availabilityText,
  };
};

function OpportunitiesSection() {
  const { opportunities, loading, error, isCollecting } = useOpportunities();
  const [activeTab, setActiveTab] = useState<'all' | 'credit' | 'bank' | 'brokerage'>(
    'all'
  );
  const [viewMode, setViewMode] = useState<'grid' | 'cards'>('cards');
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

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Organize opportunities by type
  const organizedOpportunities = {
    credit: filteredOpportunities.filter((opp) => opp.type === 'credit_card'),
    bank: filteredOpportunities.filter((opp) => opp.type === 'bank'),
    brokerage: filteredOpportunities.filter((opp) => opp.type === 'brokerage'),
  };

  const getTotalValue = (opps: Opportunity[]) =>
    opps.reduce((sum, opp) => sum + (opp.value || 0), 0);

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

  const displayedOpportunities =
    activeTab === 'all' ? filteredOpportunities : organizedOpportunities[activeTab];

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
      <Box
        sx={{
          width: '100%',
          maxWidth: '1600px',
          mx: 'auto',
          px: { xs: 1, sm: 2, md: 3 },
        }}
      >
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

        {/* Category Tabs Row */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mb: 4,
          }}
        >
          {[
            {
              id: 'all',
              label: 'All Opportunities',
              icon: MonetizationOnIcon,
              count: filteredOpportunities.length,
              value: getTotalValue(filteredOpportunities),
              colors: [theme.palette.primary.main, theme.palette.secondary.main],
              baseColor: theme.palette.primary.main,
            },
            {
              id: 'credit',
              label: 'Credit Cards',
              icon: CreditCardIcon,
              count: organizedOpportunities.credit.length,
              value: getTotalValue(organizedOpportunities.credit),
              colors: [theme.palette.primary.main, theme.palette.secondary.main],
              baseColor: theme.palette.primary.main,
            },
            {
              id: 'bank',
              label: 'Bank Accounts',
              icon: AccountBalanceIcon,
              count: organizedOpportunities.bank.length,
              value: getTotalValue(organizedOpportunities.bank),
              colors: [theme.palette.info.main, theme.palette.info.dark],
              baseColor: theme.palette.info.main,
            },
            {
              id: 'brokerage',
              label: 'Brokerage',
              icon: AccountBalanceWalletIcon,
              count: organizedOpportunities.brokerage.length,
              value: getTotalValue(organizedOpportunities.brokerage),
              colors: [theme.palette.success.main, theme.palette.success.dark],
              baseColor: theme.palette.success.main,
            },
          ].map(({ id, label, icon: Icon, count, value, colors, baseColor }) => (
            <Paper
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              sx={{
                flex: 1,
                p: 2,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: activeTab === id ? baseColor : 'divider',
                borderRadius: '10px',
                bgcolor:
                  activeTab === id
                    ? alpha(baseColor, isDark ? 0.15 : 0.08)
                    : 'background.paper',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: baseColor,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 4px 12px ${alpha(baseColor, 0.1)}`,
                },
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background:
                    activeTab === id
                      ? `linear-gradient(135deg, ${alpha(colors[0], 0.08)}, ${alpha(colors[1], 0.04)})`
                      : 'none',
                  opacity: 1,
                  transition: 'all 0.3s ease',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor:
                      activeTab === id
                        ? alpha(baseColor, isDark ? 0.2 : 0.1)
                        : alpha(baseColor, isDark ? 0.1 : 0.05),
                  }}
                >
                  <Icon
                    sx={{
                      fontSize: '1.2rem',
                      color: activeTab === id ? baseColor : 'text.secondary',
                    }}
                  />
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: activeTab === id ? 600 : 500,
                    color: activeTab === id ? baseColor : 'text.primary',
                  }}
                >
                  {label}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: activeTab === id ? baseColor : 'text.primary',
                    fontSize: '1.25rem',
                  }}
                >
                  {count}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.success.main,
                    fontWeight: 600,
                  }}
                >
                  ${value.toLocaleString()}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>

        <QuickFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {displayedOpportunities.length === 0 ? (
          <Alert
            severity="info"
            sx={{
              mt: 3,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '10px',
            }}
          >
            No opportunities found. Try different search terms or filters.
          </Alert>
        ) : viewMode === 'grid' ? (
          <Box
            sx={{
              mt: 3,
              width: '100%',
              '& .MuiDataGrid-root': {
                border: 'none',
                bgcolor: 'background.paper',
                borderRadius: '12px',
                overflow: 'hidden',
                '& .MuiDataGrid-cell': {
                  borderColor: 'divider',
                },
                '& .MuiDataGrid-columnHeaders': {
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                },
                '& .MuiDataGrid-row:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                },
              },
            }}
          >
            <DataGrid
              rows={displayedOpportunities.map(standardizeOpportunityForGrid)}
              columns={[
                {
                  field: 'title',
                  headerName: 'Opportunity',
                  flex: 1,
                  minWidth: 200,
                },
                {
                  field: 'value',
                  headerName: 'Bonus',
                  width: 120,
                  renderCell: (params) => (
                    <Typography
                      sx={{ color: theme.palette.success.main, fontWeight: 600 }}
                    >
                      {params.value}
                    </Typography>
                  ),
                },
                {
                  field: 'type',
                  headerName: 'Type',
                  width: 130,
                },
                {
                  field: 'creditCheck',
                  headerName: 'Credit Check',
                  width: 130,
                },
                {
                  field: 'fee',
                  headerName: 'Fee',
                  width: 130,
                },
                {
                  field: 'requirements',
                  headerName: 'Requirements',
                  flex: 1,
                  minWidth: 200,
                },
                {
                  field: 'actions',
                  headerName: 'Actions',
                  width: 120,
                  renderCell: (params) => (
                    <Link
                      href={`/opportunities/${params.row.id}`}
                      passHref
                      style={{ textDecoration: 'none' }}
                    >
                      <Button
                        variant="contained"
                        size="small"
                        sx={{
                          textTransform: 'none',
                          px: 2,
                          background: `linear-gradient(45deg, ${
                            getOpportunityStyles(
                              displayedOpportunities.find(
                                (opp) => opp.id === params.row.id
                              )?.type || 'credit_card',
                              theme
                            ).gradientColors
                          })`,
                          '&:hover': {
                            filter: 'brightness(1.1)',
                          },
                        }}
                      >
                        View
                      </Button>
                    </Link>
                  ),
                },
              ]}
              autoHeight
              disableRowSelectionOnClick
              pageSizeOptions={[25, 50, 100]}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 50,
                  },
                },
                columns: {
                  columnVisibilityModel: {
                    creditCheck: activeTab === 'credit',
                    fee: activeTab !== 'credit',
                  },
                },
              }}
            />
          </Box>
        ) : (
          <Box
            sx={{
              mt: 3,
              display: 'grid',
              gap: 2.5,
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              },
            }}
          >
            {displayedOpportunities.map((opportunity) => (
              <OpportunityCard
                key={`opportunity-${opportunity.id}`}
                opportunity={opportunity}
              />
            ))}
          </Box>
        )}
      </Box>
    </Container>
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

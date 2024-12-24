'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  IconButton,
  Chip,
  useTheme,
  alpha,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  LinearProgress,
  Collapse,
  Divider,
  Stack,
  Menu,
  MenuItem,
} from '@mui/material';

import {
  AccountBalanceWallet as AccountBalanceWalletIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  ArrowForward as ArrowForwardIcon,
  InfoOutlined as InfoOutlinedIcon,
  Warning as WarningIcon,
  ErrorOutline as ErrorOutlineIcon,
  AttachMoney as AttachMoneyIcon,
  Payments as PaymentsIcon,
  CalendarToday as CalendarTodayIcon,
  Verified as VerifiedIcon,
  MonetizationOn as MonetizationOnIcon,
  Search as SearchIcon,
  Launch as LaunchIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as AccountBalanceIcon,
  Schedule as ScheduleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Assessment,
  AssignmentTurnedIn,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

// Constants and types
const RISK_LEVELS = {
  LOW: { max: 2, icon: CheckCircleIcon, color: 'success' },
  MEDIUM: { max: 3, icon: InfoOutlinedIcon, color: 'info' },
  HIGH: { max: 4, icon: WarningIcon, color: 'warning' },
  CRITICAL: { max: 5, icon: ErrorOutlineIcon, color: 'error' },
} as const;

const REQUIREMENT_TYPES = {
  SPEND: { match: ['spend', 'purchase'], icon: AttachMoneyIcon },
  DEPOSIT: { match: ['direct deposit', 'payment'], icon: PaymentsIcon },
  BALANCE: { match: ['balance', 'maintain'], icon: AccountBalanceWalletIcon },
  TIME: { match: ['days', 'month', 'time'], icon: CalendarTodayIcon },
  APPROVAL: { match: ['approved', 'eligible'], icon: VerifiedIcon },
  BONUS: { match: ['bonus', 'points', 'reward'], icon: MonetizationOnIcon },
  DEFAULT: { match: [], icon: InfoOutlinedIcon },
} as const;

// Utility functions
const formatCurrency = (value: number | string) => {
  const numericValue = typeof value === 'string' 
    ? parseFloat(value.replace(/[^0-9.-]+/g, ''))
    : value;
  return !isNaN(numericValue) ? numericValue.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }) : '$0.00';
};

const getRiskLevel = (level: number = 0) => {
  const riskLevel = Object.values(RISK_LEVELS).find(r => level <= r.max) 
    ?? RISK_LEVELS.CRITICAL;
  const Icon = riskLevel.icon;
  return {
    icon: <Icon fontSize="small" color="inherit" />,
    color: riskLevel.color,
  };
};

const getRequirementType = (requirement: string) => {
  const text = requirement.toLowerCase();
  const type = Object.values(REQUIREMENT_TYPES).find(
    t => t.match.some(m => text.includes(m))
  ) ?? REQUIREMENT_TYPES.DEFAULT;
  
  const Icon = type.icon;
  return <Icon fontSize="small" sx={{ color: 'text.secondary' }} />;
};

// Reusable components
const ProgressBar = ({ progress, target }: { progress: number; target: number }) => {
  const percentage = target > 0 ? (progress / target) * 100 : 0;
  const isComplete = percentage >= 100;
  
  return (
    <Box pl={3}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={0.5}
      >
        <Typography variant="caption" color="text.secondary">
          {formatCurrency(progress)} of {formatCurrency(target)}
        </Typography>
        <Typography 
          variant="caption" 
          color={isComplete ? 'success.main' : 'primary.main'}
          fontWeight="medium"
        >
          {Math.round(percentage)}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Math.min(percentage, 100)}
        sx={{ 
          height: 6, 
          borderRadius: 1,
          bgcolor: 'action.hover',
          '& .MuiLinearProgress-bar': {
            borderRadius: 1,
            bgcolor: isComplete ? 'success.main' : 'primary.main',
          }
        }}
      />
    </Box>
  );
};

const SearchBar = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
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
          bgcolor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.background.paper, 0.6)
            : alpha(theme.palette.background.paper, 0.8),
          borderRadius: 1,
          '& fieldset': {
            borderColor: theme.palette.mode === 'dark'
              ? alpha(theme.palette.primary.main, 0.2)
              : alpha(theme.palette.primary.main, 0.1),
          },
          '&:hover fieldset': {
            borderColor: alpha(theme.palette.primary.main, 0.3),
          },
          '&.Mui-focused fieldset': {
            borderColor: theme.palette.primary.main,
          },
        },
        '& .MuiInputBase-input': {
          color: theme.palette.text.primary,
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

// Add types for opportunities
interface OpportunityMetadata {
  signupBonus?: string;
  spendRequirement?: string;
  annualFee?: string;
  categoryBonuses?: Record<string, string>;
  benefits?: string[];
  accountType?: string;
  bonusAmount?: string;
  directDepositRequired?: boolean;
  minimumBalance?: string;
  monthlyFees?: string;
  avoidableFees?: boolean;
  progress?: number;
  target?: number;
  riskLevel?: number;
  riskFactors?: string[];
  notifications?: Array<{
    type: string;
    message: string;
    date: string;
  }>;
  completedRequirements?: string[];
}

interface Opportunity {
  id: string;
  title: string;
  type: 'credit_card' | 'bank_account';
  value: number | string;
  bank: string;
  description: string;
  requirements: string[];
  source: 'reddit' | 'doc';
  sourceLink: string;
  postedDate: string;
  expirationDate?: string;
  confidence: number;
  status: string;
  metadata?: OpportunityMetadata | null;
  timeframe?: string;
}

const ValueBadge = ({ value }: { value: number | string }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const formattedValue = formatCurrency(value);
  
  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        py: 1.5,
        px: 2.5,
        borderRadius: 2,
        background: isDark 
          ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.9)}, ${alpha(theme.palette.primary.dark, 0.9)})`
          : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
        boxShadow: theme.shadows[3],
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: '1px solid',
        borderColor: isDark 
          ? alpha(theme.palette.primary.main, 0.3)
          : alpha(theme.palette.primary.light, 0.5),
        '&:hover': {
          transform: 'translateY(-2px) scale(1.02)',
          boxShadow: theme.shadows[6],
          borderColor: isDark 
            ? alpha(theme.palette.primary.main, 0.5)
            : theme.palette.primary.main,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 2,
          background: `linear-gradient(135deg, ${alpha('#fff', 0.1)}, ${alpha('#fff', 0.05)})`,
          opacity: 0,
          transition: 'opacity 0.3s',
        },
        '&:hover::before': {
          opacity: 1,
        },
      }}
    >
      <MonetizationOnIcon 
        sx={{ 
          color: '#fff',
          fontSize: '1.5rem',
          filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))',
          zIndex: 1,
        }} 
      />
      <Typography
        variant="h6"
        sx={{
          color: '#fff',
          fontWeight: 700,
          letterSpacing: '0.5px',
          textShadow: '0 2px 4px rgba(0,0,0,0.2)',
          zIndex: 1,
          fontSize: '1.35rem',
        }}
      >
        {formattedValue}
      </Typography>
    </Box>
  );
};

const ProgressIndicator = ({ progress, target }: { progress: number; target: number }) => {
  const percentage = target > 0 ? (progress / target) * 100 : 0;
  const isComplete = percentage >= 100;
  const color = isComplete ? 'success' : 'primary';
  
  return (
    <Box position="relative" display="flex" alignItems="center" gap={2}>
      <Box position="relative" sx={{ width: 48, height: 48 }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={48}
          thickness={4}
          sx={{ color: 'action.hover', position: 'absolute' }}
        />
        <CircularProgress
          variant="determinate"
          value={Math.min(percentage, 100)}
          size={48}
          thickness={4}
          color={color}
          sx={{
            position: 'absolute',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: `${color}.main`,
              fontWeight: 'medium',
              transition: 'all 0.3s',
            }}
          >
            {Math.round(percentage)}%
          </Typography>
        </Box>
      </Box>
      <Box flex={1}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Progress
        </Typography>
        <Typography variant="body2">
          {formatCurrency(progress)} of {formatCurrency(target)}
        </Typography>
      </Box>
    </Box>
  );
};

const OpportunityCard = ({ opportunity }: { opportunity: Opportunity }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [hasBeenExpanded, setHasBeenExpanded] = useState(false);
  const progress = opportunity.metadata?.progress || 0;
  const target = opportunity.metadata?.target || 0;
  const isDark = theme.palette.mode === 'dark';

  const handleExpand = () => {
    setExpanded(!expanded);
    if (!hasBeenExpanded) {
      setHasBeenExpanded(true);
    }
  };

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        mb: 2,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: expanded ? 'scale(1.01)' : 'scale(1)',
        bgcolor: isDark ? alpha(theme.palette.background.paper, 0.6) : 'background.default',
        borderColor: isDark ? alpha(theme.palette.divider, 0.3) : 'divider',
        backdropFilter: 'blur(8px)',
        '&:hover': {
          boxShadow: expanded ? 4 : 2,
          transform: expanded ? 'scale(1.01)' : 'scale(1.005)',
          borderColor: isDark ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.5),
          bgcolor: isDark ? alpha(theme.palette.background.paper, 0.8) : 'background.default',
        },
      }}
    >
      <Box 
        p={2} 
        display="flex" 
        alignItems="center" 
        justifyContent="space-between"
        onClick={handleExpand}
        sx={{ 
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': { 
            bgcolor: isDark 
              ? alpha(theme.palette.primary.main, 0.15)
              : alpha(theme.palette.primary.main, 0.05),
          },
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          {opportunity.type === 'credit_card' ? (
            <CreditCardIcon 
              color="primary"
              sx={{ 
                fontSize: '2rem',
                transition: 'transform 0.3s',
                transform: expanded ? 'rotate(360deg)' : 'none',
              }} 
            />
          ) : (
            <AccountBalanceIcon 
              color="primary"
              sx={{ 
                fontSize: '2rem',
                transition: 'transform 0.3s',
                transform: expanded ? 'rotate(360deg)' : 'none',
              }} 
            />
          )}
          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 0.5,
                transition: 'color 0.3s',
                color: expanded ? 'primary.main' : 'text.primary',
              }}
            >
              {opportunity.title}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                size="small"
                label={opportunity.bank}
                sx={{ 
                  bgcolor: expanded 
                    ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1)
                    : alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.1 : 0.05),
                  color: expanded ? 'primary.main' : 'text.primary',
                  transition: 'all 0.3s',
                  border: '1px solid',
                  borderColor: expanded ? 'primary.main' : 'transparent',
                }}
              />
              <Box display="flex" alignItems="center" gap={0.5}>
                <ScheduleIcon sx={{ fontSize: '0.875rem', color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {opportunity.timeframe || '3 months'} timeframe
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <ValueBadge value={opportunity.value} />
          {expanded ? (
            <ExpandLessIcon 
              sx={{ 
                transition: 'transform 0.3s',
                transform: 'rotate(180deg)',
                color: 'text.secondary',
              }} 
            />
          ) : (
            <ExpandMoreIcon 
              sx={{ 
                transition: 'transform 0.3s',
                color: 'text.secondary',
              }} 
            />
          )}
        </Box>
      </Box>

      <Collapse in={expanded} timeout={300}>
        <Divider />
        <Box p={2} sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'background.default' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Box mb={3}>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1.5,
                    fontSize: '1.25rem',
                    fontWeight: 500,
                    mb: 2,
                    opacity: hasBeenExpanded ? 1 : 0,
                    transform: hasBeenExpanded ? 'translateY(0)' : 'translateY(10px)',
                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <AssignmentTurnedIn 
                    sx={{ 
                      fontSize: '1.5rem',
                      color: 'primary.main',
                    }} 
                  /> 
                  Requirements
                </Typography>
                {opportunity.requirements.map((req, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      mt: 2,
                      opacity: hasBeenExpanded ? 1 : 0,
                      transform: hasBeenExpanded ? 'translateX(0)' : 'translateX(-10px)',
                      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      transitionDelay: `${index * 0.1}s`,
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      {getRequirementType(req)}
                      <Typography 
                        variant="body2"
                        sx={{
                          color: hasBeenExpanded ? 'text.primary' : 'text.secondary',
                          transition: 'color 0.3s',
                        }}
                      >
                        {req}
                      </Typography>
                    </Box>
                    {index === 0 && target > 0 && (
                      <ProgressIndicator progress={progress} target={target} />
                    )}
                  </Box>
                ))}
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  opacity: hasBeenExpanded ? 1 : 0,
                  transform: hasBeenExpanded ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  transitionDelay: '0.3s',
                }}
              >
                <RiskAssessment 
                  level={opportunity.metadata?.riskLevel || 0} 
                  factors={opportunity.metadata?.riskFactors} 
                />
              </Box>

              <Box 
                mt={2}
                sx={{
                  opacity: hasBeenExpanded ? 1 : 0,
                  transform: hasBeenExpanded ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  transitionDelay: '0.4s',
                }}
              >
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<LaunchIcon />}
                  href={opportunity.sourceLink}
                  target="_blank"
                  sx={{
                    textTransform: 'none',
                    boxShadow: 2,
                    background: 'linear-gradient(45deg, primary.main, primary.light)',
                    transition: 'all 0.3s',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)',
                    },
                  }}
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

// Custom hooks for data fetching and state management
const useOpportunities = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const response = await fetch('/opportunities/recent');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setOpportunities(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch opportunities');
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, []);

  return { opportunities, loading, error };
};

// Add these new types and constants
interface QuickFilter {
  id: string;
  label: string;
  icon: typeof CreditCardIcon;
  color: string;
}

const QUICK_FILTERS: QuickFilter[] = [
  { 
    id: 'high_value', 
    label: 'High Value', 
    icon: MonetizationOnIcon,
    color: '#2e7d32'
  },
  { 
    id: 'quick_win', 
    label: 'Quick Wins', 
    icon: CheckCircleIcon,
    color: '#1976d2'
  },
  { 
    id: 'credit_cards', 
    label: 'Credit Cards', 
    icon: CreditCardIcon,
    color: '#0288d1'
  },
  { 
    id: 'bank_accounts', 
    label: 'Bank Accounts', 
    icon: AccountBalanceIcon,
    color: '#ed6c02'
  },
];

// Enhanced opportunity filters hook
const useOpportunityFilters = (opportunities: Opportunity[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'value' | 'risk' | 'date'>('value');

  // Get unique banks from opportunities
  const availableBanks = Array.from(new Set(opportunities.map(opp => opp.bank))).sort();

  const getFilteredAndSortedOpportunities = () => {
    let filtered = [...opportunities];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(opp => 
        opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opp.bank.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply bank filter
    if (selectedBank) {
      filtered = filtered.filter(opp => opp.bank === selectedBank);
    }

    // Apply quick filters
    if (activeFilter) {
      filtered = filtered.filter(opp => {
        switch (activeFilter) {
          case 'high_value':
            return parseFloat(String(opp.value)) >= 1000;
          case 'quick_win':
            return (opp.metadata?.riskLevel || 0) <= 2 && 
                   (!opp.timeframe || parseInt(opp.timeframe) <= 3);
          case 'credit_cards':
            return opp.type === 'credit_card';
          case 'bank_accounts':
            return opp.type === 'bank_account';
          default:
            return true;
        }
      });
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'value':
          return parseFloat(String(b.value)) - parseFloat(String(a.value));
        case 'risk':
          return (a.metadata?.riskLevel || 0) - (b.metadata?.riskLevel || 0);
        case 'date':
          return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
        default:
          return 0;
      }
    });
  };

  const filteredOpportunities = getFilteredAndSortedOpportunities();

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
    filteredOpportunities,
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
        variant={selectedBank ? "contained" : "outlined"}
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
  onFilterChange 
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
            key={filter.id}
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

const OpportunitiesHeader = ({
  total,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  selectedBank,
  onBankChange,
  availableBanks,
}: {
  total: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: 'value' | 'risk' | 'date') => void;
  selectedBank: string | null;
  onBankChange: (bank: string | null) => void;
  availableBanks: string[];
}) => {
  const theme = useTheme();
  
  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography 
            variant="h4" 
            gutterBottom
            sx={{ 
              color: 'text.primary',
              fontWeight: 600,
            }}
          >
            Available Opportunities
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{
              opacity: theme.palette.mode === 'dark' ? 0.8 : 0.7,
            }}
          >
            {total} opportunities found from Reddit and Doctor of Credit
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <BankFilter
            banks={availableBanks}
            selectedBank={selectedBank}
            onBankChange={onBankChange}
          />
          {['value', 'risk', 'date'].map((option) => (
            <Button
              key={option}
              size="small"
              variant={sortBy === option ? 'contained' : 'outlined'}
              onClick={() => onSortChange(option as 'value' | 'risk' | 'date')}
              startIcon={
                option === 'value' ? <MonetizationOnIcon /> :
                option === 'risk' ? <Assessment /> :
                <CalendarTodayIcon />
              }
              sx={{ 
                textTransform: 'none',
                bgcolor: sortBy === option && theme.palette.mode === 'dark'
                  ? alpha(theme.palette.primary.main, 0.2)
                  : 'transparent',
                borderColor: sortBy === option
                  ? 'primary.main'
                  : theme.palette.mode === 'dark'
                    ? alpha(theme.palette.primary.main, 0.2)
                    : alpha(theme.palette.primary.main, 0.1),
              }}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Button>
          ))}
        </Box>
      </Box>
      <Box display="flex" flexDirection="column" gap={2} mb={3}>
        <SearchBar value={searchTerm} onChange={onSearchChange} />
      </Box>
    </Box>
  );
};

const RiskAssessment = ({ level = 0, factors = [] }: { level?: number; factors?: string[] }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { icon, color } = getRiskLevel(level);
  
  const getColorFromPalette = (colorName: string) => {
    switch (colorName) {
      case 'success':
        return theme.palette.success.main;
      case 'info':
        return theme.palette.info.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'error':
        return theme.palette.error.main;
      default:
        return theme.palette.primary.main;
    }
  };
  
  const riskColor = getColorFromPalette(color);
  
  return (
    <Box 
      bgcolor={isDark ? alpha(theme.palette.background.paper, 0.4) : theme.palette.action.hover}
      p={2} 
      borderRadius={2}
      sx={{
        border: '1px solid',
        borderColor: isDark ? alpha(theme.palette.divider, 0.2) : theme.palette.divider,
        backdropFilter: 'blur(8px)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: 4,
          height: '100%',
          background: isDark ? alpha(riskColor, 0.7) : riskColor,
          transition: 'width 0.3s',
        },
        '&:hover': {
          bgcolor: isDark 
            ? alpha(theme.palette.background.paper, 0.6)
            : alpha(theme.palette.action.hover, 0.8),
          borderColor: isDark ? alpha(theme.palette.primary.main, 0.3) : theme.palette.divider,
          '&::before': {
            width: 6,
          },
        },
      }}
    >
      <Typography
        variant="subtitle2"
        gutterBottom
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: theme.palette.text.primary,
          fontWeight: 500,
        }}
      >
        <Assessment fontSize="small" sx={{ color: isDark ? alpha(riskColor, 0.9) : riskColor }} /> 
        Risk Assessment
      </Typography>
      <Box 
        display="flex" 
        alignItems="center" 
        gap={1} 
        mb={2}
        sx={{
          transform: 'scale(1)',
          transition: 'transform 0.3s',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        }}
      >
        {icon}
        <Typography
          variant="body2"
          sx={{
            color: isDark ? alpha(riskColor, 0.9) : riskColor,
            fontWeight: "medium"
          }}
        >
          Level {level}/5
        </Typography>
      </Box>
      <Stack spacing={1}>
        {factors?.map((factor, index) => (
          <Box 
            key={index} 
            display="flex" 
            alignItems="center" 
            gap={1}
            sx={{
              opacity: 0,
              transform: 'translateX(-10px)',
              animation: 'slideIn 0.5s forwards',
              animationDelay: `${index * 0.1}s`,
              '@keyframes slideIn': {
                to: {
                  opacity: 1,
                  transform: 'translateX(0)',
                },
              },
            }}
          >
            <RadioButtonUncheckedIcon 
              fontSize="small" 
              sx={{ 
                color: isDark ? alpha(theme.palette.text.secondary, 0.7) : theme.palette.text.secondary,
                transition: 'color 0.3s',
                '&:hover': {
                  color: isDark ? alpha(riskColor, 0.9) : riskColor,
                },
              }} 
            />
            <Typography 
              variant="body2" 
              sx={{
                color: isDark ? alpha(theme.palette.text.secondary, 0.9) : theme.palette.text.secondary,
                transition: 'color 0.3s',
                '&:hover': {
                  color: theme.palette.text.primary,
                },
              }}
            >
              {factor}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

function AIOpportunitiesSection() {
  const { opportunities, loading, error } = useOpportunities();
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
          {error}
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
      />
      
      <QuickFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

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
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </Box>
      )}
    </Box>
  );
}

export default function OpportunitiesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
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
      <AIOpportunitiesSection />
    </div>
  );
}

'use client';

import {
  MonetizationOn,
  SortByAlpha,
  Category,
  CalendarToday,
  Search as SearchIcon,
  GridView as GridViewIcon,
  ViewList as ViewListIcon,
  Sort as SortIcon,
  CreditCard,
  AccountBalance,
  AccountBalanceWallet,
  Timer,
  Public,
  Diamond,
  AttachMoney,
  ShoppingCart,
  Payments,
  Block,
  CheckCircle,
  CreditScore,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Container,
  Grid,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { FirestoreOpportunity } from '@/types/opportunity';

import FloatingAddButton from './FloatingAddButton';
import OpportunitiesHeader from './OpportunitiesHeader';
import OpportunityDeleteDialog from './OpportunityDeleteDialog';
import OpportunityGrid from './OpportunityGrid';
import OpportunityList from './OpportunityList';
import { getTypeColors } from '../utils/colorUtils';
import { sortAndFilterOpportunities } from '../utils/filterUtils';

interface OpportunitiesSectionProps {
  opportunities: FirestoreOpportunity[];
  loading: boolean;
  error: Error | null;
  onDeleteAction: (id: string) => Promise<void>;
  onAddOpportunityAction: () => void;
  initialCategory?: string | null;
}

const CATEGORY_MAP = {
  'credit-cards': 'credit_card',
  banks: 'bank',
  brokerages: 'brokerage',
} as const;

const REVERSE_CATEGORY_MAP = {
  credit_card: 'credit-cards',
  bank: 'banks',
  brokerage: 'brokerages',
} as const;

const QUICK_FILTERS = [
  {
    id: 'premium_offers',
    label: 'Premium ($500+)',
    icon: MonetizationOn,
    color: '#9c27b0',
    filter: (opp: FirestoreOpportunity) => opp.value >= 500,
  },
  {
    id: 'credit_card',
    label: 'Credit Cards',
    icon: CreditCard,
    color: '#1976d2',
    filter: (opp: FirestoreOpportunity) => opp.type === 'credit_card',
  },
  {
    id: 'bank',
    label: 'Bank Accounts',
    icon: AccountBalance,
    color: '#2e7d32',
    filter: (opp: FirestoreOpportunity) => opp.type === 'bank',
  },
  {
    id: 'brokerage',
    label: 'Brokerage',
    icon: AccountBalanceWallet,
    color: '#ed6c02',
    filter: (opp: FirestoreOpportunity) => opp.type === 'brokerage',
  },
  {
    id: 'quick_bonus',
    label: 'Quick Win',
    icon: Timer,
    color: '#0288d1',
    filter: (opp: FirestoreOpportunity) =>
      opp.requirements?.some(
        (req) =>
          req.toLowerCase().includes('single') ||
          req.toLowerCase().includes('one time') ||
          req.toLowerCase().includes('first')
      ) ?? false,
  },
  {
    id: 'nationwide',
    label: 'Nationwide',
    icon: Public,
    color: '#388e3c',
    filter: (opp: FirestoreOpportunity) => opp.metadata?.availability?.is_nationwide === true,
  },
];

const FILTER_GROUPS = [
  {
    label: 'Value Tiers',
    filters: [
      {
        id: 'ultra_premium',
        label: 'Ultra ($1000+)',
        icon: Diamond,
        color: '#9c27b0',
        filter: (opp: FirestoreOpportunity) => opp.value >= 1000,
      },
      {
        id: 'premium',
        label: 'Premium ($500+)',
        icon: MonetizationOn,
        color: '#2e7d32',
        filter: (opp: FirestoreOpportunity) => opp.value >= 500 && opp.value < 1000,
      },
      {
        id: 'standard',
        label: 'Standard ($200+)',
        icon: AttachMoney,
        color: '#1976d2',
        filter: (opp: FirestoreOpportunity) => opp.value >= 200 && opp.value < 500,
      },
    ],
  },
  {
    label: 'Requirements',
    filters: [
      {
        id: 'direct_deposit',
        label: 'Direct Deposit',
        icon: Payments,
        color: '#0288d1',
        filter: (opp: FirestoreOpportunity) =>
          opp.requirements?.some((req) => req.toLowerCase().includes('direct deposit')) ?? false,
      },
      {
        id: 'no_direct_deposit',
        label: 'No DD Required',
        icon: Block,
        color: '#d32f2f',
        filter: (opp: FirestoreOpportunity) =>
          !opp.requirements?.some((req) => req.toLowerCase().includes('direct deposit')) ?? true,
      },
      {
        id: 'low_spend',
        label: 'Low Spend',
        icon: ShoppingCart,
        color: '#388e3c',
        filter: (opp: FirestoreOpportunity) => {
          const spendMatch = opp.requirements?.join(' ').match(/\$(\d+)/);
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
        icon: CreditScore,
        color: '#2e7d32',
        filter: (opp: FirestoreOpportunity) => opp.metadata?.credit?.inquiry === 'soft_pull',
      },
      {
        id: 'no_524',
        label: 'No 5/24 Impact',
        icon: CheckCircle,
        color: '#1976d2',
        filter: (opp: FirestoreOpportunity) =>
          opp.type === 'credit_card' && !opp.details?.under_5_24?.required,
      },
    ],
  },
];

export default function OpportunitiesSection({
  opportunities: initialOpportunities,
  loading,
  error,
  onDeleteAction,
  onAddOpportunityAction,
}: OpportunitiesSectionProps) {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDark = theme.palette.mode === 'dark';
  const [opportunities, setOpportunities] =
    useState<FirestoreOpportunity[]>(initialOpportunities);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedSmartFilters, setSelectedSmartFilters] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [sortBy, setSortBy] = useState<'value' | 'regions' | 'date'>('value');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    opportunity: FirestoreOpportunity | null;
  }>({
    open: false,
    opportunity: null,
  });
  const { user } = useAuth();

  // Initialize selected type from URL parameter
  const [selectedType, setSelectedType] = useState<string | null>(() => {
    const category = searchParams.get('category');
    if (!category) return null;
    return CATEGORY_MAP[category as keyof typeof CATEGORY_MAP] || null;
  });

  // Get unique banks for filtering
  const availableBanks = Array.from(
    new Set(opportunities.filter((opp) => opp.bank).map((opp) => opp.bank!))
  ).sort();

  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  // Update URL when filter changes
  const updateUrl = (newType: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newType) {
      const urlCategory =
        REVERSE_CATEGORY_MAP[newType as keyof typeof REVERSE_CATEGORY_MAP];
      if (urlCategory) {
        params.set('category', urlCategory);
      }
    } else {
      params.delete('category');
    }

    // Preserve other query parameters
    const newUrl = `/opportunities${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(newUrl, { scroll: false });
  };

  // Handle type selection
  const handleTypeClick = (type: string | null) => {
    setSelectedType(type);
    updateUrl(type);
  };

  // Sync state with URL when URL changes
  useEffect(() => {
    const category = searchParams.get('category');
    const newType = category
      ? CATEGORY_MAP[category as keyof typeof CATEGORY_MAP] || null
      : null;

    if (newType !== selectedType) {
      setSelectedType(newType);
    }
  }, [searchParams, selectedType]);

  const handleDeleteClick = (opportunity: FirestoreOpportunity) => {
    if (!user) {
      router.push('/auth/signin?redirect=/opportunities');
      return;
    }
    setDeleteDialog({ open: true, opportunity });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, opportunity: null });
    setIsDeleting(false);
  };

  const handleDeleteConfirm = async () => {
    const id = deleteDialog.opportunity?.id;
    if (!id) {
      console.error('Cannot delete opportunity: ID is undefined');
      return;
    }

    setIsDeleting(true);
    try {
      await onDeleteAction(id);
      // Remove the opportunity from the local state
      const updatedOpportunities = opportunities.filter((opp) => opp.id !== id);
      setOpportunities(updatedOpportunities);
      setDeleteDialog({ open: false, opportunity: null });
    } catch (error) {
      console.error('Failed to delete opportunity:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: 'grid' | 'list' | null
  ) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  const handleSortClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleSortClose = () => {
    setAnchorEl(null);
  };

  const handleSortSelect = (type: string) => {
    // If clicking the same sort type, toggle direction
    if (type === sortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If selecting a new sort type, default to ascending
      setSortBy(type as 'value' | 'regions' | 'date');
      setSortDirection('asc');
    }
    handleSortClose();
  };

  // Enhanced filtering logic
  const getFilteredAndSortedOpportunities = () => {
    let filtered = opportunities;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (opp) =>
          opp.name.toLowerCase().includes(searchLower) ||
          (opp.bank || '').toLowerCase().includes(searchLower) ||
          (opp.description || '').toLowerCase().includes(searchLower) ||
          opp.requirements?.some((req) => req.toLowerCase().includes(searchLower))
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

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'value':
          return b.value - a.value;
        case 'regions':
          const aRegions = a.metadata?.availability?.regions || [];
          const bRegions = b.metadata?.availability?.regions || [];
          return bRegions.length - aRegions.length;
        case 'date':
          return (
            new Date(b.metadata.created_at).getTime() -
            new Date(a.metadata.created_at).getTime()
          );
        default:
          return 0;
      }
    });
  };

  const filteredOpportunities = getFilteredAndSortedOpportunities();

  // Calculate statistics
  const stats = {
    total: filteredOpportunities.length,
    averageValue: Math.round(
      filteredOpportunities.reduce((sum, opp) => sum + opp.value, 0) /
        filteredOpportunities.length
    ),
    byType: {
      credit_card: filteredOpportunities.filter((opp) => opp.type === 'credit_card')
        .length,
      bank: filteredOpportunities.filter((opp) => opp.type === 'bank').length,
      brokerage: filteredOpportunities.filter((opp) => opp.type === 'brokerage')
        .length,
    },
    highValue: filteredOpportunities.filter((opp) => opp.value >= 500).length,
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          minHeight: '200px',
          justifyContent: 'center',
        }}
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              border: '3px solid',
              borderColor: 'primary.main',
              borderRightColor: 'transparent',
            }}
          />
        </motion.div>
        <Typography
          variant="h6"
          sx={{
            color: 'text.secondary',
            fontWeight: 500,
            textAlign: 'center',
          }}
        >
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Loading opportunities...
          </motion.span>
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container
        maxWidth="lg"
        sx={{
          py: { xs: 2, md: 4 },
          mt: { xs: '64px', md: '72px' },
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              bgcolor: isDark
                ? alpha(theme.palette.background.paper, 0.6)
                : 'background.paper',
              border: '1px solid',
              borderColor: alpha(theme.palette.error.main, 0.2),
              backdropFilter: 'blur(8px)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h5" color="error" sx={{ fontWeight: 600 }}>
                Error Loading Opportunities
              </Typography>
            </Box>
            <Typography color="text.secondary">
              {error instanceof Error ? error.message : 'Unknown error'}
            </Typography>
          </Paper>
        </motion.div>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: { xs: 2, md: 4 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 3,
          bgcolor: isDark
            ? alpha(theme.palette.background.paper, 0.6)
            : 'background.paper',
          border: '1px solid',
          borderColor: isDark ? alpha(theme.palette.divider, 0.1) : 'divider',
          backdropFilter: 'blur(8px)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isDark
              ? 'radial-gradient(circle at top right, rgba(25, 118, 210, 0.12), transparent 70%)'
              : 'radial-gradient(circle at top right, rgba(25, 118, 210, 0.05), transparent 70%)',
            zIndex: 0,
          },
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <OpportunitiesHeader onAddOpportunity={onAddOpportunityAction} />

          {/* Category Boxes */}
          <Box sx={{ mb: { xs: 2, md: 4 } }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  component={motion.div}
                  whileHover={{ y: -4 }}
                  onClick={() => handleTypeClick(null)}
                  sx={{
                    p: 3,
                    height: '100%',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: selectedType === null ? 'primary.main' : 'divider',
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s',
                    boxShadow: selectedType === null ? 4 : 0,
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: 4,
                    },
                  }}
                >
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                        color: theme.palette.primary.main,
                      }}
                    >
                      <MonetizationOn sx={{ fontSize: '2rem' }} />
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      All Offers
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      View all available opportunities
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {['credit_card', 'bank', 'brokerage'].map((type) => {
                const colors = getTypeColors(type, theme);
                const displayName =
                  type === 'credit_card'
                    ? 'Credit Card'
                    : type === 'bank'
                      ? 'Bank Account'
                      : 'Brokerage Account';
                return (
                  <Grid key={type} item xs={12} sm={6} md={3}>
                    <Paper
                      component={motion.div}
                      whileHover={{ y: -4 }}
                      onClick={() => handleTypeClick(type)}
                      sx={{
                        p: 3,
                        height: '100%',
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: selectedType === type ? colors.primary : 'divider',
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.3s',
                        boxShadow: selectedType === type ? 4 : 0,
                        '&:hover': {
                          borderColor: colors.primary,
                          boxShadow: 4,
                        },
                      }}
                    >
                      <Box sx={{ position: 'relative', zIndex: 1 }}>
                        <Box
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: 2,
                            bgcolor: alpha(colors.primary, 0.2),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 2,
                            color: colors.primary,
                          }}
                        >
                          {colors.icon}
                        </Box>
                        <Typography variant="h6" gutterBottom>
                          {displayName}s
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          View {displayName.toLowerCase()} offers
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Box>

          {/* Search and Sort Controls */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 3 },
              mb: { xs: 2, md: 4 },
              borderRadius: 3,
              bgcolor: isDark
                ? alpha(theme.palette.background.paper, 0.6)
                : 'background.paper',
              border: '1px solid',
              borderColor: isDark ? alpha(theme.palette.divider, 0.1) : 'divider',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                gap: { xs: 1, md: 2 },
                alignItems: 'center',
                flexWrap: { xs: 'wrap', md: 'nowrap' },
              }}
            >
              <TextField
                placeholder="Search opportunities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: isDark
                      ? alpha(theme.palette.background.paper, 0.6)
                      : alpha(theme.palette.background.paper, 0.8),
                    transition: 'all 0.3s',
                    '&:hover, &.Mui-focused': {
                      bgcolor: isDark
                        ? alpha(theme.palette.background.paper, 0.8)
                        : alpha(theme.palette.background.paper, 1),
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'primary.main' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={handleViewModeChange}
                aria-label="view mode"
                sx={{
                  bgcolor: isDark
                    ? alpha(theme.palette.background.paper, 0.6)
                    : alpha(theme.palette.background.paper, 0.8),
                  p: 0.5,
                  borderRadius: 2,
                  height: 40,
                  '& .MuiToggleButton-root': {
                    border: 'none',
                    borderRadius: 1.5,
                    px: 1.5,
                    minWidth: 40,
                    transition: 'all 0.2s',
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.15),
                      },
                    },
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                    },
                    '& .MuiSvgIcon-root': {
                      fontSize: '1.2rem',
                    },
                  },
                }}
              >
                <ToggleButton value="grid" aria-label="grid view">
                  <GridViewIcon />
                </ToggleButton>
                <ToggleButton value="list" aria-label="list view">
                  <ViewListIcon />
                </ToggleButton>
              </ToggleButtonGroup>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleSortClose}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    minWidth: 180,
                    borderRadius: 2,
                    bgcolor: isDark
                      ? alpha(theme.palette.background.paper, 0.8)
                      : 'background.paper',
                    backdropFilter: 'blur(8px)',
                    boxShadow: theme.shadows[3],
                    border: '1px solid',
                    borderColor: isDark ? alpha(theme.palette.divider, 0.1) : 'divider',
                    '& .MuiMenuItem-root': {
                      px: 2,
                      py: 1.5,
                      borderRadius: 1,
                      mx: 0.5,
                      mb: 0.5,
                      gap: 1.5,
                      transition: 'all 0.2s',
                      '&:last-child': {
                        mb: 0,
                      },
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      },
                      '& .MuiSvgIcon-root': {
                        fontSize: '1.2rem',
                        color: theme.palette.text.secondary,
                      },
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem
                  onClick={() => handleSortSelect('value')}
                  selected={sortBy === 'value'}
                >
                  <SortByAlpha />
                  Value
                </MenuItem>
                <MenuItem
                  onClick={() => handleSortSelect('regions')}
                  selected={sortBy === 'regions'}
                >
                  <Category />
                  Regions
                </MenuItem>
                <MenuItem
                  onClick={() => handleSortSelect('date')}
                  selected={sortBy === 'date'}
                >
                  <CalendarToday />
                  Date Added
                </MenuItem>
              </Menu>

              <Button
                onClick={handleSortClick}
                sx={{
                  borderRadius: 2,
                  minWidth: 40,
                  height: 40,
                  p: 0,
                  bgcolor: isDark
                    ? alpha(theme.palette.background.paper, 0.6)
                    : alpha(theme.palette.background.paper, 0.8),
                  color: sortBy ? 'primary.main' : 'text.primary',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: isDark
                      ? alpha(theme.palette.background.paper, 0.8)
                      : alpha(theme.palette.background.paper, 1),
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
                  },
                  '& .MuiSvgIcon-root': {
                    fontSize: '1.2rem',
                  },
                }}
              >
                <SortIcon />
              </Button>
            </Box>
          </Paper>

          {/* Opportunities List/Grid */}
          {viewMode === 'grid' ? (
            <OpportunityGrid
              opportunities={filteredOpportunities}
              onDeleteClick={handleDeleteClick}
              isDeleting={isDeleting ? deleteDialog.opportunity?.id || null : null}
            />
          ) : (
            <OpportunityList
              opportunities={filteredOpportunities}
              onDeleteClick={handleDeleteClick}
              isDeleting={isDeleting ? deleteDialog.opportunity?.id || null : null}
            />
          )}

          {/* Delete Confirmation Dialog */}
          <OpportunityDeleteDialog
            open={deleteDialog.open}
            opportunity={deleteDialog.opportunity}
            onCancelAction={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
            loading={isDeleting}
          />

          {/* Floating Add Button for Mobile */}
          <FloatingAddButton />
        </Box>
      </Paper>
    </Container>
  );
}

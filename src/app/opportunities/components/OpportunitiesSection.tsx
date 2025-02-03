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
  Alert,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { useOpportunities } from '@/lib/hooks/useOpportunities';
import { FirestoreOpportunity } from '@/types/opportunity';

import FloatingAddButton from './FloatingAddButton';
import OpportunitiesHeader from './OpportunitiesHeader';
import OpportunityDeleteDialog from './OpportunityDeleteDialog';
import OpportunityGrid from './OpportunityGrid';
import OpportunityList from './OpportunityList';
import { getTypeColors } from '../utils/colorUtils';

interface OpportunitiesSectionProps {
  onDeleteAction: (id: string) => Promise<void>;
  onAddOpportunityAction: () => void;
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

export default function OpportunitiesSection({
  onDeleteAction,
  onAddOpportunityAction,
}: OpportunitiesSectionProps) {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isDark = theme.palette.mode === 'dark';
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [sortBy, setSortBy] = useState<'value' | 'name' | 'type' | 'date' | null>(
    'value'
  );
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    opportunity: FirestoreOpportunity | null;
  }>({
    open: false,
    opportunity: null,
  });

  // Initialize selected type from URL parameter
  const [selectedType, setSelectedType] = useState<string | null>(() => {
    const category = searchParams.get('category');
    if (!category) return null;
    return CATEGORY_MAP[category as keyof typeof CATEGORY_MAP] || null;
  });

  // Use the enhanced useOpportunities hook with proper params
  const {
    opportunities: fetchedOpportunities,
    isLoading,
    error: opportunitiesError,
    refetch,
  } = useOpportunities({
    searchTerm,
    type: selectedType,
    sortBy,
    sortDirection,
  });

  // Filter opportunities based on search term
  const filteredOpportunities = useMemo(() => {
    if (!fetchedOpportunities) return [];

    return fetchedOpportunities.filter((opp) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        opp.name.toLowerCase().includes(searchLower) ||
        opp.type.toLowerCase().includes(searchLower) ||
        (opp.description && opp.description.toLowerCase().includes(searchLower))
      );
    });
  }, [fetchedOpportunities, searchTerm]);

  // Log the opportunities data for debugging
  useEffect(() => {
    console.log('OpportunitiesSection - Current state:', {
      fetchedOpportunities: {
        count: fetchedOpportunities.length,
        sample: fetchedOpportunities[0]
          ? {
              id: fetchedOpportunities[0].id,
              name: fetchedOpportunities[0].name,
              type: fetchedOpportunities[0].type,
            }
          : null,
      },
      filteredOpportunities: {
        count: filteredOpportunities.length,
        sample: filteredOpportunities[0]
          ? {
              id: filteredOpportunities[0].id,
              name: filteredOpportunities[0].name,
              type: filteredOpportunities[0].type,
            }
          : null,
      },
      searchTerm,
      selectedType,
      sortBy,
      sortDirection,
      isLoading,
      error: opportunitiesError,
    });
  }, [
    fetchedOpportunities,
    filteredOpportunities,
    searchTerm,
    selectedType,
    sortBy,
    sortDirection,
    isLoading,
    opportunitiesError,
  ]);

  // Handle type selection
  const handleTypeClick = (type: string | null) => {
    setSelectedType(type);
    updateUrl(type);
  };

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

  const handleDeleteClick = (opportunity: FirestoreOpportunity) => {
    if (!user) {
      router.push('/auth/signin?redirect=/opportunities');
      return;
    }
    setDeleteDialog({ open: true, opportunity });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, opportunity: null });
    setIsDeleting(null);
  };

  const handleDeleteConfirm = async () => {
    const id = deleteDialog.opportunity?.id;
    if (!id) {
      console.error('Cannot delete opportunity: ID is undefined');
      return;
    }

    setIsDeleting(id);
    try {
      await onDeleteAction(id);
      // Remove the opportunity from the local state
      refetch();
      setDeleteDialog({ open: false, opportunity: null });
    } catch (error) {
      console.error('Failed to delete opportunity:', error);
    } finally {
      setIsDeleting(null);
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
      setSortBy(type as 'value' | 'name' | 'type' | 'date' | null);
      setSortDirection('asc');
    }
    handleSortClose();
  };

  if (opportunitiesError instanceof Error) {
    return <Alert severity="error">{opportunitiesError.message}</Alert>;
  }

  if (isLoading) {
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
                  onClick={() => handleSortSelect('name')}
                  selected={sortBy === 'name'}
                >
                  <SortByAlpha />
                  Name
                </MenuItem>
                <MenuItem
                  onClick={() => handleSortSelect('type')}
                  selected={sortBy === 'type'}
                >
                  <Category />
                  Type
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
          {filteredOpportunities.length === 0 && !isLoading ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                py: 8,
              }}
            >
              <Typography variant="h6" color="text.secondary">
                No opportunities found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search or filters
              </Typography>
            </Box>
          ) : viewMode === 'grid' ? (
            <OpportunityGrid
              opportunities={filteredOpportunities}
              onDeleteClick={handleDeleteClick}
              isDeleting={isDeleting}
            />
          ) : (
            <OpportunityList
              opportunities={filteredOpportunities}
              onDeleteClick={handleDeleteClick}
              isDeleting={isDeleting}
            />
          )}

          {/* Delete Confirmation Dialog */}
          <OpportunityDeleteDialog
            open={deleteDialog.open}
            opportunity={deleteDialog.opportunity}
            onCancelAction={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
            loading={Boolean(isDeleting)}
          />

          {/* Floating Add Button for Mobile */}
          <FloatingAddButton />
        </Box>
      </Paper>
    </Container>
  );
}

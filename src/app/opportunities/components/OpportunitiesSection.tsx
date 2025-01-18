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
} from '@mui/material';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

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
  onDelete: (id: string) => Promise<void>;
  onAddOpportunity: () => void;
}

export default function OpportunitiesSection({
  opportunities: initialOpportunities,
  loading,
  error,
  onDelete,
  onAddOpportunity,
}: OpportunitiesSectionProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [sortBy, setSortBy] = useState<'value' | 'name' | 'type' | 'date' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    opportunity?: { id?: string; name?: string };
  }>({ open: false });

  // Update local state when initialOpportunities changes
  useEffect(() => {
    setOpportunities(initialOpportunities);
  }, [initialOpportunities]);

  const handleDeleteClick = (opportunity: { id?: string; name?: string }) => {
    setDeleteDialog({ open: true, opportunity });
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false });
  };

  const handleDeleteConfirm = async () => {
    const id = deleteDialog.opportunity?.id;
    if (!id) {
      console.error('Cannot delete opportunity: ID is undefined');
      return;
    }

    setIsDeleting(id);
    try {
      await onDelete(id);
      setOpportunities(opportunities.filter((opp) => opp.id !== id));
      setDeleteDialog({ open: false });
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

  const handleSortSelect = (type: 'value' | 'name' | 'type' | 'date') => {
    if (sortBy === type) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(type);
      setSortOrder('desc');
    }
    handleSortClose();
  };

  const filteredAndSortedOpportunities = sortAndFilterOpportunities(
    opportunities || [],
    searchTerm,
    selectedType,
    sortBy,
    sortOrder
  );

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
      maxWidth="lg"
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
          <OpportunitiesHeader onAddOpportunity={onAddOpportunity} />

          {/* Category Boxes */}
          <Box sx={{ mb: { xs: 2, md: 4 } }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  component={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  elevation={0}
                  onClick={() => setSelectedType(null)}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    cursor: 'pointer',
                    bgcolor:
                      selectedType === null
                        ? alpha(theme.palette.primary.main, 0.1)
                        : isDark
                          ? alpha(theme.palette.background.paper, 0.6)
                          : 'background.paper',
                    border: '1px solid',
                    borderColor:
                      selectedType === null
                        ? theme.palette.primary.main
                        : isDark
                          ? alpha(theme.palette.divider, 0.1)
                          : 'divider',
                    transition: 'all 0.3s',
                    overflow: 'hidden',
                    position: 'relative',
                    backdropFilter: 'blur(8px)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[4],
                      borderColor: theme.palette.primary.main,
                      '&::after': {
                        opacity: 1,
                      },
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `radial-gradient(circle at top right, ${alpha(
                        theme.palette.primary.main,
                        0.12
                      )}, transparent 70%)`,
                      opacity: selectedType === null ? 1 : 0,
                      transition: 'opacity 0.3s',
                      pointerEvents: 'none',
                      zIndex: 0,
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
                return (
                  <Grid item xs={12} sm={6} md={3} key={type}>
                    <Paper
                      component={motion.div}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      elevation={0}
                      onClick={() => setSelectedType(type)}
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        cursor: 'pointer',
                        bgcolor:
                          selectedType === type
                            ? colors.alpha
                            : isDark
                              ? alpha(theme.palette.background.paper, 0.6)
                              : 'background.paper',
                        border: '1px solid',
                        borderColor:
                          selectedType === type
                            ? colors.primary
                            : isDark
                              ? alpha(theme.palette.divider, 0.1)
                              : 'divider',
                        transition: 'all 0.3s',
                        overflow: 'hidden',
                        position: 'relative',
                        backdropFilter: 'blur(8px)',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[4],
                          borderColor: colors.primary,
                          '&::after': {
                            opacity: 1,
                          },
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: `radial-gradient(circle at top right, ${alpha(
                            colors.primary,
                            0.12
                          )}, transparent 70%)`,
                          opacity: selectedType === type ? 1 : 0,
                          transition: 'opacity 0.3s',
                          pointerEvents: 'none',
                          zIndex: 0,
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
                          {type
                            .split('_')
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ')}
                          s
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          View{' '}
                          {type
                            .split('_')
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ')}{' '}
                          offers
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
                  <MonetizationOn />
                  Value
                  {sortBy === 'value' && (
                    <Box sx={{ ml: 'auto', opacity: 0.5 }}>
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </Box>
                  )}
                </MenuItem>
                <MenuItem
                  onClick={() => handleSortSelect('name')}
                  selected={sortBy === 'name'}
                >
                  <SortByAlpha />
                  Name
                  {sortBy === 'name' && (
                    <Box sx={{ ml: 'auto', opacity: 0.5 }}>
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </Box>
                  )}
                </MenuItem>
                <MenuItem
                  onClick={() => handleSortSelect('type')}
                  selected={sortBy === 'type'}
                >
                  <Category />
                  Type
                  {sortBy === 'type' && (
                    <Box sx={{ ml: 'auto', opacity: 0.5 }}>
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </Box>
                  )}
                </MenuItem>
                <MenuItem
                  onClick={() => handleSortSelect('date')}
                  selected={sortBy === 'date'}
                >
                  <CalendarToday />
                  Date Added
                  {sortBy === 'date' && (
                    <Box sx={{ ml: 'auto', opacity: 0.5 }}>
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </Box>
                  )}
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
              opportunities={filteredAndSortedOpportunities}
              onDeleteClick={handleDeleteClick}
              isDeleting={isDeleting}
            />
          ) : (
            <OpportunityList
              opportunities={filteredAndSortedOpportunities}
              onDeleteClick={handleDeleteClick}
              isDeleting={isDeleting}
            />
          )}

          {/* Delete Confirmation Dialog */}
          <OpportunityDeleteDialog
            open={deleteDialog.open}
            opportunity={deleteDialog.opportunity}
            onCancel={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
          />

          {/* Floating Add Button for Mobile */}
          <FloatingAddButton />
        </Box>
      </Paper>
    </Container>
  );
}

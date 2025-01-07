'use client';

import {
  AccountBalance as AccountBalanceIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Add as AddIcon,
  CreditCard as CreditCardIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
  GridView as GridViewIcon,
  ViewList as ViewListIcon,
  Sort as SortIcon,
  MonetizationOn,
  SortByAlpha,
  Category,
  CalendarToday,
} from '@mui/icons-material';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Fab,
  Grid,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { useOpportunities } from '@/lib/hooks/useOpportunities';
import { FirestoreOpportunity } from '@/types/opportunity';

interface TypeColors {
  primary: string;
  light: string;
  dark: string;
  alpha: string;
  icon: React.ReactNode;
}

function LogoImage({
  logo,
  name,
  colors,
}: {
  logo?: { url?: string; type?: string };
  name: string;
  colors: TypeColors;
}) {
  const [imageError, setImageError] = useState(false);

  // Helper function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!logo?.url || imageError) {
    return (
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 0.5,
        }}
      >
        {colors.icon}
        <Typography
          variant="caption"
          sx={{
            color: colors.primary,
            fontWeight: 600,
            textAlign: 'center',
            lineHeight: 1,
          }}
        >
          {getInitials(name)}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={logo.url}
      alt={name}
      onError={() => setImageError(true)}
      sx={{
        height: '100%',
        width: 'auto',
        maxWidth: '100%',
        objectFit: 'contain',
        filter: 'brightness(0.9)',
        transition: 'all 0.3s',
      }}
    />
  );
}

function OpportunitiesSection() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { data: opportunities, isLoading, error, deleteOpportunity } = useOpportunities();
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
  const router = useRouter();

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
      await deleteOpportunity(id);
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

  const sortAndFilterOpportunities = (opportunities: FirestoreOpportunity[]) => {
    if (!opportunities) return [];

    return opportunities
      .filter((opp): opp is FirestoreOpportunity => {
        // Ensure ID exists
        if (!opp.id) return false;

        // Filter by search term
        const matchesSearch =
          !searchTerm ||
          [opp.name, opp.description, opp.bonus?.description].some((text) =>
            text?.toLowerCase().includes(searchTerm.toLowerCase())
          );

        // Filter by type
        const matchesType = !selectedType || opp.type === selectedType;

        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        if (!sortBy) return 0;

        let comparison = 0;
        switch (sortBy) {
          case 'value':
            const aTotal = (a.bonus?.tiers?.[0]?.value || 0) + a.value;
            const bTotal = (b.bonus?.tiers?.[0]?.value || 0) + b.value;
            comparison = bTotal - aTotal;
            break;
          case 'name':
            comparison = (a.name || '').localeCompare(b.name || '');
            break;
          case 'type':
            comparison = (a.type || '').localeCompare(b.type || '');
            break;
          case 'date':
            const aDate = a.metadata?.created_at || '';
            const bDate = b.metadata?.created_at || '';
            comparison = new Date(bDate).getTime() - new Date(aDate).getTime();
            break;
        }
        return sortOrder === 'asc' ? -comparison : comparison;
      });
  };

  const filteredAndSortedOpportunities = sortAndFilterOpportunities(opportunities || []);

  // Helper function to get type-specific colors
  const getTypeColors = (type: string) => {
    switch (type) {
      case 'credit_card':
        return {
          primary: alpha(theme.palette.error.main, 0.8),
          light: alpha(theme.palette.error.light, 0.8),
          dark: alpha(theme.palette.error.dark, 0.9),
          alpha: alpha(theme.palette.error.main, 0.08),
          icon: <CreditCardIcon sx={{ fontSize: '2.5rem', opacity: 0.9 }} />,
        };
      case 'brokerage':
        return {
          primary: alpha(theme.palette.success.main, 0.8),
          light: alpha(theme.palette.success.light, 0.8),
          dark: alpha(theme.palette.success.dark, 0.9),
          alpha: alpha(theme.palette.success.main, 0.08),
          icon: <AccountBalanceWalletIcon sx={{ fontSize: '2.5rem', opacity: 0.9 }} />,
        };
      default: // bank
        return {
          primary: alpha(theme.palette.primary.main, 0.8),
          light: alpha(theme.palette.primary.light, 0.8),
          dark: alpha(theme.palette.primary.dark, 0.9),
          alpha: alpha(theme.palette.primary.main, 0.08),
          icon: <AccountBalanceIcon sx={{ fontSize: '2.5rem', opacity: 0.9 }} />,
        };
    }
  };

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

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
            boxShadow: theme.shadows[1],
            border: '1px solid',
            borderColor: alpha(theme.palette.error.main, 0.2),
            backdropFilter: 'blur(8px)',
            '& .MuiAlert-icon': {
              fontSize: '2rem',
            },
          }}
        >
          <AlertTitle sx={{ fontSize: '1.2rem' }}>Error Loading Opportunities</AlertTitle>
          {error instanceof Error ? error.message : 'Unknown error'}
        </Alert>
      </motion.div>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
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
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Box>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '0.02em',
                    mb: 1,
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: -8,
                      left: 0,
                      width: 60,
                      height: 3,
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, transparent)`,
                      borderRadius: 1,
                    },
                  }}
                >
                  Available Opportunities
                </Typography>
                <Typography color="text.secondary">
                  Discover and compare the latest financial opportunities
                </Typography>
              </motion.div>
            </Box>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => router.push('/opportunities/add')}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
                  transition: 'all 0.3s',
                  overflow: 'hidden',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: -100,
                    width: '70px',
                    height: '100%',
                    background: 'rgba(255, 255, 255, 0.3)',
                    transform: 'skewX(-15deg)',
                    transition: 'all 0.6s',
                    filter: 'blur(5px)',
                  },
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 12px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                    '&::before': {
                      left: '200%',
                    },
                  },
                  display: { xs: 'none', md: 'flex' },
                }}
              >
                Add Opportunity
              </Button>
            </motion.div>
          </Box>

          {/* Category Boxes */}
          <Box sx={{ mb: 4 }}>
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
                      background: `radial-gradient(circle at top right, ${alpha(theme.palette.primary.main, 0.12)}, transparent 70%)`,
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
                const colors = getTypeColors(type);
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
                          background: `radial-gradient(circle at top right, ${alpha(colors.primary, 0.12)}, transparent 70%)`,
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
              p: 3,
              mb: 4,
              borderRadius: 3,
              bgcolor: isDark
                ? alpha(theme.palette.background.paper, 0.6)
                : 'background.paper',
              border: '1px solid',
              borderColor: isDark ? alpha(theme.palette.divider, 0.1) : 'divider',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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

          {/* Grid View */}
          {viewMode === 'grid' && (
            <Grid container spacing={2}>
              {filteredAndSortedOpportunities?.map((opportunity, index) => {
                const colors = getTypeColors(opportunity.type);
                return (
                  <Grid item xs={12} sm={6} md={4} key={opportunity.id}>
                    <Paper
                      component={motion.div}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      elevation={0}
                      sx={{
                        height: '100%',
                        p: 3,
                        borderRadius: 3,
                        bgcolor: isDark
                          ? alpha(theme.palette.background.paper, 0.6)
                          : 'background.paper',
                        border: '1px solid',
                        borderColor: isDark
                          ? alpha(theme.palette.divider, 0.1)
                          : 'divider',
                        position: 'relative',
                        transition: 'all 0.3s',
                        overflow: 'hidden',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        flexDirection: 'column',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[4],
                          '& .delete-button': {
                            opacity: 1,
                          },
                          '& .card-icon': {
                            transform: 'scale(1.1) rotate(5deg)',
                          },
                          '&::before': {
                            transform: 'translateX(0)',
                          },
                          '&::after': {
                            opacity: 1,
                          },
                        },
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: 4,
                          height: '100%',
                          background: `linear-gradient(to bottom, ${colors.primary}, ${colors.light})`,
                          transform: 'translateX(-4px)',
                          transition: 'transform 0.3s',
                          pointerEvents: 'none',
                          zIndex: 0,
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: `radial-gradient(circle at top right, ${alpha(colors.primary, 0.12)}, transparent 70%)`,
                          opacity: 0,
                          transition: 'opacity 0.3s',
                          pointerEvents: 'none',
                          zIndex: 0,
                        },
                      }}
                    >
                      <Box sx={{ position: 'relative', mb: 2, zIndex: 1 }}>
                        <Box
                          className="card-icon"
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: colors.alpha,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 2,
                            transition: 'transform 0.3s',
                            position: 'relative',
                            height: 80,
                            width: '100%',
                            overflow: 'hidden',
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: `radial-gradient(circle at top right, ${alpha(colors.primary, 0.12)}, transparent 70%)`,
                              opacity: 0,
                              transition: 'opacity 0.3s',
                            },
                            '&:hover::after': {
                              opacity: 1,
                            },
                          }}
                        >
                          <LogoImage
                            logo={opportunity.logo}
                            name={opportunity.name}
                            colors={colors}
                          />
                        </Box>
                        <Tooltip title="Delete opportunity">
                          <IconButton
                            className="delete-button"
                            onClick={() => handleDeleteClick(opportunity)}
                            disabled={isDeleting === opportunity.id}
                            sx={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              opacity: 0,
                              transition: 'opacity 0.2s ease-in-out',
                              color: theme.palette.error.main,
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.error.main, 0.1),
                              },
                            }}
                          >
                            {isDeleting === opportunity.id ? (
                              <CircularProgress size={20} color="error" />
                            ) : (
                              <DeleteIcon />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Box>

                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {opportunity.name}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {opportunity.type.replace('_', ' ').toUpperCase()}
                      </Typography>

                      <Typography
                        variant="h5"
                        sx={{ color: 'primary.main', fontWeight: 600, mb: 2 }}
                      >
                        ${opportunity.value.toLocaleString()}
                      </Typography>

                      {opportunity.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {opportunity.description}
                        </Typography>
                      )}

                      {opportunity.bonus?.description && (
                        <Box
                          sx={{
                            p: 2,
                            mb: 2,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            border: '1px solid',
                            borderColor: alpha(theme.palette.primary.main, 0.1),
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {opportunity.bonus.description}
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ mt: 'auto', display: 'flex', gap: 1 }}>
                        <Link
                          href={`/opportunities/${opportunity.id}`}
                          style={{ textDecoration: 'none', flexGrow: 1 }}
                        >
                          <Button
                            fullWidth
                            variant="contained"
                            sx={{
                              borderRadius: 1.5,
                              textTransform: 'none',
                              fontWeight: 500,
                              background: `linear-gradient(135deg, ${colors.primary}, ${colors.dark})`,
                              boxShadow: `0 4px 8px ${alpha(colors.primary, 0.15)}`,
                              transition: 'all 0.3s',
                              overflow: 'hidden',
                              position: 'relative',
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: -100,
                                width: '70px',
                                height: '100%',
                                background: 'rgba(255, 255, 255, 0.2)',
                                transform: 'skewX(-15deg)',
                                transition: 'all 0.6s',
                                filter: 'blur(5px)',
                              },
                              '&:hover': {
                                background: `linear-gradient(135deg, ${colors.dark}, ${colors.primary})`,
                                transform: 'translateY(-1px)',
                                boxShadow: `0 4px 8px ${alpha(colors.primary, 0.15)}`,
                                '&::before': {
                                  left: '200%',
                                },
                              },
                            }}
                          >
                            View Details
                          </Button>
                        </Link>
                        {opportunity.offer_link && (
                          <Button
                            variant="outlined"
                            href={opportunity.offer_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              borderRadius: 1.5,
                              textTransform: 'none',
                              fontWeight: 500,
                              borderColor: alpha(colors.primary, 0.5),
                              color: colors.primary,
                              '&:hover': {
                                borderColor: colors.primary,
                                bgcolor: alpha(colors.primary, 0.04),
                                transform: 'translateY(-1px)',
                              },
                            }}
                          >
                            View Offer
                          </Button>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}

          {/* List View with similar color updates */}
          {viewMode === 'list' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filteredAndSortedOpportunities?.map((opportunity, index) => {
                const colors = getTypeColors(opportunity.type);
                return (
                  <Paper
                    key={opportunity.id}
                    component={motion.div}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      bgcolor: isDark
                        ? alpha(theme.palette.background.paper, 0.6)
                        : 'background.paper',
                      border: '1px solid',
                      borderColor: isDark ? alpha(theme.palette.divider, 0.1) : 'divider',
                      position: 'relative',
                      transition: 'all 0.2s ease-out',
                      overflow: 'hidden',
                      backdropFilter: 'blur(8px)',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 12px ${alpha(theme.palette.divider, 0.2)}`,
                        '& .delete-button': {
                          opacity: 1,
                        },
                        '& .list-icon': {
                          transform: 'scale(1.02)',
                        },
                        '&::before': {
                          transform: 'translateX(0)',
                        },
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: 3,
                        height: '100%',
                        background: colors.primary,
                        transform: 'translateX(-3px)',
                        transition: 'transform 0.2s ease-out',
                        pointerEvents: 'none',
                        zIndex: 0,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 2,
                        position: 'relative',
                        zIndex: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          className="list-icon"
                          sx={{
                            width: 56,
                            height: 56,
                            p: 1,
                            borderRadius: 2,
                            bgcolor: colors.alpha,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'transform 0.3s',
                            overflow: 'hidden',
                            position: 'relative',
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: `radial-gradient(circle at top right, ${alpha(colors.primary, 0.12)}, transparent 70%)`,
                              opacity: 0,
                              transition: 'opacity 0.3s',
                            },
                            '&:hover::after': {
                              opacity: 1,
                            },
                          }}
                        >
                          <LogoImage
                            logo={opportunity.logo}
                            name={opportunity.name}
                            colors={colors}
                          />
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {opportunity.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {opportunity.type.replace('_', ' ').toUpperCase()}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography
                            variant="h6"
                            sx={{ color: 'primary.main', fontWeight: 600 }}
                          >
                            ${opportunity.value.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Bonus Value
                          </Typography>
                        </Box>
                        <Tooltip title="Delete opportunity">
                          <IconButton
                            className="delete-button"
                            onClick={() => handleDeleteClick(opportunity)}
                            disabled={isDeleting === opportunity.id}
                            sx={{
                              opacity: 0,
                              transition: 'opacity 0.2s ease-in-out',
                              color: theme.palette.error.main,
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.error.main, 0.1),
                              },
                            }}
                          >
                            {isDeleting === opportunity.id ? (
                              <CircularProgress size={20} color="error" />
                            ) : (
                              <DeleteIcon />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {opportunity.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {opportunity.description}
                      </Typography>
                    )}

                    {opportunity.bonus?.description && (
                      <Box
                        sx={{
                          p: 2,
                          mb: 2,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                          border: '1px solid',
                          borderColor: alpha(theme.palette.primary.main, 0.1),
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {opportunity.bonus.description}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Link
                        href={`/opportunities/${opportunity.id}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <Button
                          variant="contained"
                          sx={{
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontWeight: 500,
                            background: `linear-gradient(135deg, ${colors.primary}, ${colors.dark})`,
                            boxShadow: `0 4px 8px ${alpha(colors.primary, 0.15)}`,
                            transition: 'all 0.3s',
                            overflow: 'hidden',
                            position: 'relative',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: -100,
                              width: '70px',
                              height: '100%',
                              background: 'rgba(255, 255, 255, 0.2)',
                              transform: 'skewX(-15deg)',
                              transition: 'all 0.6s',
                              filter: 'blur(5px)',
                            },
                            '&:hover': {
                              background: `linear-gradient(135deg, ${colors.dark}, ${colors.primary})`,
                              transform: 'translateY(-1px)',
                              boxShadow: `0 4px 8px ${alpha(colors.primary, 0.15)}`,
                              '&::before': {
                                left: '200%',
                              },
                            },
                          }}
                        >
                          View Details
                        </Button>
                      </Link>
                      {opportunity.offer_link && (
                        <Button
                          variant="outlined"
                          href={opportunity.offer_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            borderRadius: 1.5,
                            textTransform: 'none',
                            fontWeight: 500,
                            borderColor: alpha(colors.primary, 0.5),
                            color: colors.primary,
                            '&:hover': {
                              borderColor: colors.primary,
                              bgcolor: alpha(colors.primary, 0.04),
                              transform: 'translateY(-1px)',
                            },
                          }}
                        >
                          View Offer
                        </Button>
                      )}
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          )}

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={deleteDialog.open}
            onClose={handleDeleteCancel}
            PaperProps={{
              sx: {
                minWidth: { xs: '90%', sm: '400px' },
                maxWidth: '500px',
                p: 1,
                borderRadius: 2,
                background: alpha(theme.palette.background.paper, 0.9),
                backdropFilter: 'blur(10px)',
              },
            }}
          >
            <DialogTitle
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: theme.palette.error.main,
              }}
            >
              <WarningIcon color="error" />
              Confirm Deletion
            </DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to delete{' '}
                <strong>{deleteDialog.opportunity?.name}</strong>? This action cannot be
                undone.
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button
                onClick={handleDeleteCancel}
                variant="outlined"
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: alpha(theme.palette.text.primary, 0.23),
                  color: theme.palette.text.primary,
                  '&:hover': {
                    borderColor: alpha(theme.palette.text.primary, 0.33),
                    background: alpha(theme.palette.text.primary, 0.05),
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                variant="contained"
                color="error"
                disabled={isDeleting === deleteDialog.opportunity?.id}
                sx={{
                  ml: 1,
                  position: 'relative',
                  minWidth: '100px',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                {isDeleting === deleteDialog.opportunity?.id ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  'Delete'
                )}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Floating Add Button for Mobile */}
          <Tooltip title="Add Opportunity" placement="left">
            <Fab
              color="primary"
              aria-label="add opportunity"
              onClick={() => router.push('/opportunities/add')}
              sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                display: { xs: 'flex', md: 'none' },
                boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 12px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                },
              }}
            >
              <AddIcon />
            </Fab>
          </Tooltip>
        </Box>
      </Paper>
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
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  return <OpportunitiesSection />;
}

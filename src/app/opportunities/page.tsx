'use client';

import {
  AccountBalance as AccountBalanceIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Add as AddIcon,
  CreditCard as CreditCardIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Alert,
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
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { useOpportunities } from '@/lib/hooks/useOpportunities';

function OpportunitiesSection() {
  const theme = useTheme();
  const { data: opportunities, isLoading, error, deleteOpportunity } = useOpportunities();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
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

  // Basic filtering logic
  const filteredOpportunities = opportunities?.filter((opp) => {
    const matchesSearch =
      searchTerm === '' ||
      opp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = !selectedType || opp.type === selectedType;

    return matchesSearch && matchesType;
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        Failed to load opportunities:{' '}
        {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Search and Filters */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" gutterBottom>
            Available Opportunities
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push('/opportunities/add')}
            sx={{
              bgcolor: theme.palette.primary.main,
              color: 'white',
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
              },
              boxShadow: 'none',
              height: 40,
            }}
          >
            Add Opportunity
          </Button>
        </Box>

        <TextField
          placeholder="Search opportunities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <Button
            variant={selectedType === null ? 'contained' : 'outlined'}
            onClick={() => setSelectedType(null)}
          >
            All
          </Button>
          <Button
            startIcon={<CreditCardIcon />}
            variant={selectedType === 'credit_card' ? 'contained' : 'outlined'}
            onClick={() => setSelectedType('credit_card')}
          >
            Credit Cards
          </Button>
          <Button
            startIcon={<AccountBalanceIcon />}
            variant={selectedType === 'bank' ? 'contained' : 'outlined'}
            onClick={() => setSelectedType('bank')}
          >
            Bank Accounts
          </Button>
          <Button
            startIcon={<AccountBalanceWalletIcon />}
            variant={selectedType === 'brokerage' ? 'contained' : 'outlined'}
            onClick={() => setSelectedType('brokerage')}
          >
            Brokerage
          </Button>
        </Box>
      </Box>

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
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: theme.palette.error.main,
        }}>
          <WarningIcon color="error" />
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{deleteDialog.opportunity?.name}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleDeleteCancel}
            variant="outlined"
            sx={{
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
            boxShadow: theme.shadows[4],
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
            },
          }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      {/* Opportunities List */}
      {filteredOpportunities?.length === 0 ? (
        <Alert severity="info">
          No opportunities found. Try different search terms or filters.
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredOpportunities?.map((opportunity) => (
            <Paper 
              key={opportunity.id} 
              sx={{ 
                p: 3,
                position: 'relative',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[4],
                  '& .delete-button': {
                    opacity: 1,
                  },
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">{opportunity.name}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h6" color="primary">
                    ${opportunity.value.toLocaleString()}
                  </Typography>
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

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {opportunity.description}
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography variant="body2">Type: {opportunity.type}</Typography>
                {opportunity.bonus?.description && (
                  <Typography variant="body2">
                    Bonus: {opportunity.bonus.description}
                  </Typography>
                )}
              </Box>

              <Box sx={{ mt: 2 }}>
                <Link
                  href={`/opportunities/${opportunity.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <Button variant="contained">View Details</Button>
                </Link>
                {opportunity.offer_link && (
                  <Button
                    variant="outlined"
                    href={opportunity.offer_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ ml: 1 }}
                  >
                    View Offer
                  </Button>
                )}
              </Box>
            </Paper>
          ))}
        </Box>
      )}
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

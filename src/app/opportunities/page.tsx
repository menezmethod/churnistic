'use client';

import {
  AccountBalance as AccountBalanceIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  CreditCard as CreditCardIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { useOpportunities } from '@/lib/hooks/useOpportunities';

function OpportunitiesSection() {
  const { data: opportunities, isLoading, error } = useOpportunities();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);

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
        <Typography variant="h4" gutterBottom>
          Available Opportunities
        </Typography>

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

      {/* Opportunities List */}
      {filteredOpportunities?.length === 0 ? (
        <Alert severity="info">
          No opportunities found. Try different search terms or filters.
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredOpportunities?.map((opportunity) => (
            <Paper key={opportunity.id} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">{opportunity.name}</Typography>
                <Typography variant="h6" color="primary">
                  ${opportunity.value.toLocaleString()}
                </Typography>
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

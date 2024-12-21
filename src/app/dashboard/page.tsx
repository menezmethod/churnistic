'use client';

import {
  CreditCard,
  AccountBalance,
  Timeline,
  TrendingUp,
  Settings,
} from '@mui/icons-material';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Alert,
} from '@mui/material';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { trpc } from '@/lib/trpc/client';

interface UserProfile {
  id: string;
  role: string;
  email: string;
  status: string;
  displayName?: string;
  photoURL?: string;
  firebaseUid: string;
  creditScore: number | null;
  monthlyIncome: number | null;
  businessVerified: boolean;
  createdAt: string;
  updatedAt: string;
  householdId: string | null;
  customDisplayName?: string;
}

interface CardApplication {
  id: string;
  issuer: string;
  card: string;
  status: 'pending' | 'approved' | 'denied';
  appliedDate: string;
  bonus: number;
  spendRequired: number;
  spendProgress: number;
  deadline: string;
}

interface BankBonus {
  id: string;
  bank: string;
  bonus: number;
  requirements: string;
  deadline: string;
  status: 'pending' | 'completed' | 'failed';
}

function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const { data: userProfile } = trpc.user.me.useQuery(undefined, {
    enabled: !!user,
  });

  useEffect(() => {
    if (userProfile) {
      setProfile(userProfile);
      setLoading(false);
    }
  }, [userProfile]);

  // Mock data for credit card applications
  const cardApplications: CardApplication[] = [
    {
      id: '1',
      issuer: 'Chase',
      card: 'Sapphire Preferred',
      status: 'approved',
      appliedDate: '2024-01-15',
      bonus: 60000,
      spendRequired: 4000,
      spendProgress: 2500,
      deadline: '2024-04-15',
    },
    {
      id: '2',
      issuer: 'American Express',
      card: 'Gold Card',
      status: 'pending',
      appliedDate: '2024-01-18',
      bonus: 75000,
      spendRequired: 5000,
      spendProgress: 1000,
      deadline: '2024-04-18',
    },
  ];

  // Mock data for bank bonuses
  const bankBonuses: BankBonus[] = [
    {
      id: '1',
      bank: 'Chase',
      bonus: 300,
      requirements: 'Direct deposit of $5,000 within 90 days',
      deadline: '2024-03-20',
      status: 'pending',
    },
    {
      id: '2',
      bank: 'Citi',
      bonus: 700,
      requirements: 'Maintain $50,000 balance for 60 days',
      deadline: '2024-04-01',
      status: 'completed',
    },
  ];

  // Calculate total potential bonuses
  const totalCardBonuses = cardApplications.reduce((sum, app) => sum + app.bonus, 0);
  const totalBankBonuses = bankBonuses.reduce((sum, bonus) => sum + bonus.bonus, 0);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{
        mt: 4,
        mb: 4,
        backgroundColor: 'transparent',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
      }}
    >
      {/* Welcome Message and Account Link */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {profile?.customDisplayName || profile?.displayName || 'Churner'}
        </Typography>
        <Link href="/settings" passHref style={{ textDecoration: 'none' }}>
          <Button
            variant="outlined"
            startIcon={<Settings />}
            sx={{ textTransform: 'none' }}
          >
            Settings
          </Button>
        </Link>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <CreditCard color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Active Cards</Typography>
              </Box>
              <Typography variant="h4">{cardApplications.length}</Typography>
              <Typography color="text.secondary" variant="body2">
                Total potential points: {totalCardBonuses.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AccountBalance color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Bank Bonuses</Typography>
              </Box>
              <Typography variant="h4">${totalBankBonuses}</Typography>
              <Typography color="text.secondary" variant="body2">
                Active opportunities: {bankBonuses.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Timeline color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Next Deadline</Typography>
              </Box>
              <Typography variant="h4">15d</Typography>
              <Typography color="text.secondary" variant="body2">
                Chase Sapphire spend requirement
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingUp color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Value</Typography>
              </Box>
              <Typography variant="h4">
                ${(totalCardBonuses * 0.015 + totalBankBonuses).toLocaleString()}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Combined bonus value
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Credit Card Applications */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Recent Card Applications
      </Typography>
      <Grid container spacing={3}>
        {cardApplications.map((app) => (
          <Grid item xs={12} md={6} key={app.id}>
            <Card>
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="h6">
                    {app.issuer} {app.card}
                  </Typography>
                  <Alert
                    severity={
                      app.status === 'approved'
                        ? 'success'
                        : app.status === 'denied'
                          ? 'error'
                          : 'info'
                    }
                    sx={{ py: 0 }}
                  >
                    {app.status.toUpperCase()}
                  </Alert>
                </Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Applied: {new Date(app.appliedDate).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Bonus: {app.bonus.toLocaleString()} points
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Spend Progress: ${app.spendProgress.toLocaleString()} / $
                    {app.spendRequired.toLocaleString()}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(app.spendProgress / app.spendRequired) * 100}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Bank Bonuses */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Active Bank Bonuses
      </Typography>
      <Grid container spacing={3}>
        {bankBonuses.map((bonus) => (
          <Grid item xs={12} md={6} key={bonus.id}>
            <Card>
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="h6">{bonus.bank}</Typography>
                  <Alert
                    severity={
                      bonus.status === 'completed'
                        ? 'success'
                        : bonus.status === 'failed'
                          ? 'error'
                          : 'info'
                    }
                    sx={{ py: 0 }}
                  >
                    {bonus.status.toUpperCase()}
                  </Alert>
                </Box>
                <Typography variant="h5" color="primary" gutterBottom>
                  ${bonus.bonus}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Requirements: {bonus.requirements}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Deadline: {new Date(bonus.deadline).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Action Buttons */}
      <Box display="flex" gap={2} mt={4}>
        <Button variant="contained" color="primary">
          Add New Card
        </Button>
        <Button variant="outlined" color="primary">
          Track New Bank Bonus
        </Button>
      </Box>
    </Container>
  );
}

export default DashboardPage;

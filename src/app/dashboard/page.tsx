'use client';

import { Settings as SettingsIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { trpc } from '@/lib/trpc/client';
import { CardStatus } from '@/types/card';

interface UserProfile {
  displayName: string;
  email: string;
  photoURL?: string;
}

interface CardApplication {
  id: string;
  cardId: string;
  status: CardStatus;
  appliedAt: Date;
  approvedAt?: Date;
  bonusEarnedAt?: Date;
  closedAt?: Date;
  spendProgress: number;
  annualFeePaid: boolean;
  card: {
    name: string;
    signupBonus: number;
    minSpend: number;
    minSpendPeriod: number;
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [applications, setApplications] = useState<CardApplication[]>([]);

  const { data: userProfile } = trpc.user.me.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: cardApplications } = trpc.card.getApplications.useQuery(
    { limit: 5 },
    {
      enabled: !!user,
    }
  );

  useEffect(() => {
    if (userProfile) {
      setProfile(userProfile);
    }
    if (cardApplications) {
      setApplications(cardApplications.items);
    }
    if (userProfile || cardApplications) {
      setLoading(false);
    }
  }, [userProfile, cardApplications]);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography>Loading...</Typography>
        </Box>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography>Error loading profile</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Typography variant="h4" component="h1">
            Welcome back, {profile.displayName}
          </Typography>
          <IconButton
            component={Link}
            href="/settings"
            aria-label="settings"
            sx={{ color: 'text.primary' }}
          >
            <SettingsIcon />
          </IconButton>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Cards
                </Typography>
                <Typography variant="h5">5</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Bank Bonuses
                </Typography>
                <Typography variant="h5">3</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Next Deadline
                </Typography>
                <Typography variant="h5">7 days</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Value
                </Typography>
                <Typography variant="h5">$2,500</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Recent Card Applications
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Card</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Applied</TableCell>
                  <TableCell>Spend Progress</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>{app.card.name}</TableCell>
                    <TableCell>{app.status}</TableCell>
                    <TableCell>{new Date(app.appliedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {app.spendProgress} / {app.card.minSpend}
                    </TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined">
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </Container>
  );
}

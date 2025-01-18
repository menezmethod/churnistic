'use client';

import { Container, Box, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { FirestoreOpportunity } from '@/types/opportunity';

import OpportunitiesSection from './components/OpportunitiesSection';

const API_BASE_URL = '/api/opportunities';

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<FirestoreOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const handleAddOpportunity = () => {
    router.push('/opportunities/add');
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) {
          throw new Error('Failed to fetch opportunities');
        }
        const data = await response.json();
        setOpportunities(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load opportunities'));
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, authLoading, router]);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete opportunity');
      }
      setOpportunities((prev) => prev.filter((opp) => opp.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete opportunity'));
    }
  };

  if (authLoading) {
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

  return (
    <OpportunitiesSection
      opportunities={opportunities}
      loading={loading}
      error={error}
      onDelete={handleDelete}
      onAddOpportunity={handleAddOpportunity}
    />
  );
}

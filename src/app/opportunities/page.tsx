'use client';

import { Box, CircularProgress, Container } from '@mui/material';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { FirestoreOpportunity } from '@/types/opportunity';

import OpportunitiesSection from './components/OpportunitiesSection';

const API_BASE_URL = '/api/opportunities';

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<FirestoreOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleAddOpportunity = () => {
    if (!user) {
      router.push('/auth/signin?redirect=/opportunities/add');
      return;
    }
    router.push('/opportunities/add');
  };

  useEffect(() => {
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

    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    if (!user) {
      router.push('/auth/signin?redirect=/opportunities');
      return;
    }

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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <OpportunitiesSection
      opportunities={opportunities}
      loading={loading}
      error={error}
      onDeleteAction={handleDelete}
      onAddOpportunityAction={handleAddOpportunity}
      initialCategory={searchParams.get('category')}
    />
  );
}

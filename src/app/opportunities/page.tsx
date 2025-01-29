'use client';

import { Box, CircularProgress, Container } from '@mui/material';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';
import { AuthUser } from '@/lib/auth/authService';
import { FirestoreOpportunity } from '@/types/opportunity';
import { useOpportunities } from '@/lib/opportunities/useOpportunities';

import OpportunitiesSection from './components/OpportunitiesSection';

const API_BASE_URL = '/api/opportunities';

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<FirestoreOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { data: fetchedOpportunities, isLoading } = useOpportunities(100);

  useEffect(() => {
    if (fetchedOpportunities) {
      setOpportunities(fetchedOpportunities);
      setLoading(false);
    }
  }, [fetchedOpportunities]);

  return (
    <Suspense
      fallback={
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="60vh"
          >
            <CircularProgress />
          </Box>
        </Container>
      }
    >
      <OpportunitiesPageContent
        opportunities={opportunities}
        loading={loading}
        error={error}
        user={user}
        router={router}
        setOpportunities={setOpportunities}
        setLoading={setLoading}
        setError={setError}
      />
    </Suspense>
  );
}

function OpportunitiesPageContent({
  opportunities,
  loading,
  error,
  user,
  router,
  setOpportunities,
  setLoading,
  setError,
}: {
  opportunities: FirestoreOpportunity[];
  loading: boolean;
  error: Error | null;
  user: AuthUser | null;
  router: AppRouterInstance;
  setOpportunities: (value: FirestoreOpportunity[]) => void;
  setLoading: (value: boolean) => void;
  setError: (value: Error | null) => void;
}) {
  const searchParams = useSearchParams();

  const handleAddOpportunity = () => {
    if (!user) {
      router.push('/auth/signin?redirect=/opportunities/add');
      return;
    }
    router.push('/opportunities/add');
  };

  const handleDelete = async (id: string) => {
    if (!user) {
      router.push('/auth/signin?redirect=/opportunities');
      return;
    }

    try {
      const response = await fetch(`/api/opportunities/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete opportunity');
      }

      // Update local state after successful deletion
      const updated = opportunities.filter((opp) => opp.id !== id);
      setOpportunities(updated);
    } catch (err) {
      console.error('Error deleting opportunity:', err);
      setError(err instanceof Error ? err : new Error('Failed to delete opportunity'));
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
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

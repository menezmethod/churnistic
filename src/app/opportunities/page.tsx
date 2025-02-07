'use client';

import { useRouter } from 'next/navigation';
import { Suspense } from 'react';

import { useAuth } from '@/lib/auth/AuthContext';

import OpportunitiesSection from './components/OpportunitiesSection';

const API_BASE_URL = '/api/listings';

export default function OpportunitiesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OpportunitiesPageContent />
    </Suspense>
  );
}

function OpportunitiesPageContent() {
  const router = useRouter();
  const { user } = useAuth();

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
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete opportunity');
      }

      // Refresh the page
      router.refresh();
    } catch (error) {
      console.error('Error deleting opportunity:', error);
    }
  };

  return (
    <OpportunitiesSection
      onDeleteAction={handleDelete}
      onAddOpportunityAction={handleAddOpportunity}
    />
  );
}

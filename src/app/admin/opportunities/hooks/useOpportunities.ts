import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useState, useEffect } from 'react';

import { db } from '@/lib/firebase/config';

import { Opportunity } from '../types/opportunity';
import { mockOpportunities } from '../utils/mockData';

export const useOpportunities = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(mockOpportunities);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const opportunitiesRef = collection(db, 'opportunities');
        const q = query(
          opportunitiesRef,
          where('status', '==', 'pending'),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        const fetchedOpportunities = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Opportunity[];

        setOpportunities(fetchedOpportunities);
        setError(null);
      } catch (err) {
        setError('Failed to fetch opportunities');
        console.error('Error fetching opportunities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, []);

  const approveOpportunity = async (id: string) => {
    // TODO: Implement approval logic using the id
    console.log('Approving opportunity with id:', id);
  };

  const rejectOpportunity = async (id: string) => {
    // TODO: Implement rejection logic using the id
    console.log('Rejecting opportunity with id:', id);
  };

  return {
    opportunities,
    loading,
    error,
    approveOpportunity,
    rejectOpportunity,
  };
};

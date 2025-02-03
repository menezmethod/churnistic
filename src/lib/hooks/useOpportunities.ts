import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAuth } from 'firebase/auth';

import { FirestoreOpportunity } from '@/types/opportunity';

const API_BASE = '/api/opportunities';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    console.error('API Error:', {
      status: response.status,
      url: response.url,
      headers: Object.fromEntries(response.headers.entries()),
    });
    try {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Request failed');
    } catch (e) {
      if (e instanceof SyntaxError) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      throw e;
    }
  }
  try {
    const data = await response.json();
    console.log('API Response:', {
      status: response.status,
      url: response.url,
      data: Array.isArray(data)
        ? {
            count: data.length,
            sample: data[0]
              ? {
                  id: data[0].id,
                  name: data[0].name,
                  type: data[0].type,
                }
              : null,
          }
        : data,
    });
    return data;
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error('Invalid JSON response from server');
    }
    throw e;
  }
}

const getOpportunities = async (params?: {
  limit?: number;
  searchTerm?: string;
  type?: string | null;
  sortBy?: 'value' | 'name' | 'type' | 'date' | null;
  sortDirection?: 'asc' | 'desc';
}): Promise<FirestoreOpportunity[]> => {
  console.log('Fetching opportunities with params:', params);
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/opportunities`
    : '/api/opportunities';

  // Create URL using window.location.origin for relative paths
  const url = new URL(
    baseUrl.startsWith('http') ? baseUrl : `${window.location.origin}${baseUrl}`
  );

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, value.toString());
      }
    });
  }

  // Get auth token
  const auth = getAuth();
  const user = auth.currentUser;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (user) {
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, { headers });
    console.log('Opportunities API response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
    });

    const data = await handleResponse<FirestoreOpportunity[]>(response);
    console.log('Opportunities data:', {
      count: data.length,
      sample: data[0]
        ? {
            id: data[0].id,
            name: data[0].name,
            type: data[0].type,
          }
        : null,
    });
    return data;
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    throw error;
  }
};

const createOpportunity = async (
  data: Omit<FirestoreOpportunity, 'id'>
): Promise<FirestoreOpportunity> => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user found');
  }

  const token = await user.getIdToken();
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...data,
      metadata: {
        ...data.metadata,
        created_by: user.email,
        updated_by: user.email,
      },
    }),
  });
  return handleResponse<FirestoreOpportunity>(response);
};

const updateOpportunity = async (params: {
  id: string;
  data: Partial<FirestoreOpportunity>;
}): Promise<FirestoreOpportunity> => {
  const { id, data } = params;
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user found');
  }

  const token = await user.getIdToken();
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...data,
      metadata: {
        ...data.metadata,
        updated_by: user.email,
        updated_at: new Date().toISOString(),
      },
    }),
  });
  return handleResponse<FirestoreOpportunity>(response);
};

// Type guard for FirestoreOpportunity
function isFirestoreOpportunity(response: unknown): response is FirestoreOpportunity {
  return (
    typeof response === 'object' &&
    response !== null &&
    'id' in response &&
    'metadata' in response
  );
}

const deleteOpportunity = async (id: string): Promise<void> => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user found');
  }

  const token = await user.getIdToken();
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete opportunity');
  }
};

export function useOpportunities(params?: {
  limit?: number;
  searchTerm?: string;
  type?: string | null;
  sortBy?: 'value' | 'name' | 'type' | 'date' | null;
  sortDirection?: 'asc' | 'desc';
}) {
  const queryClient = useQueryClient();

  const query = useQuery<FirestoreOpportunity[]>({
    queryKey: ['opportunities', params],
    queryFn: () => getOpportunities(params),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    refetchOnMount: true,
    refetchOnWindowFocus: process.env.NODE_ENV === 'development',
    retry: (failureCount, error) => {
      if (error.message.includes('Failed to fetch')) return true;
      return failureCount < 2;
    },
    networkMode: 'online',
  });

  const createMutation = useMutation({
    mutationKey: ['opportunities'],
    mutationFn: createOpportunity,
    onSuccess: (newOpportunity) => {
      queryClient.setQueryData<FirestoreOpportunity[]>(
        ['opportunities', params],
        (old) => (old ? [newOpportunity, ...old] : [newOpportunity])
      );
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateOpportunity,
    onSuccess: (updatedOpportunity) => {
      if (!isFirestoreOpportunity(updatedOpportunity)) return;
      queryClient.setQueryData<FirestoreOpportunity[]>(
        ['opportunities', params],
        (old) => {
          return old
            ? old.map((opp) =>
                opp.id === updatedOpportunity.id ? updatedOpportunity : opp
              )
            : [];
        }
      );
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({
        queryKey: ['opportunity', updatedOpportunity.id],
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOpportunity,
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['opportunities', params] });
      await queryClient.cancelQueries({ queryKey: ['opportunity', deletedId] });

      const previousOpportunities = queryClient.getQueryData<FirestoreOpportunity[]>([
        'opportunities',
        params,
      ]);

      queryClient.setQueryData<FirestoreOpportunity[]>(
        ['opportunities', params],
        (old) => {
          return old ? old.filter((opp) => opp.id !== deletedId) : [];
        }
      );

      queryClient.setQueryData(['opportunity', deletedId], null);

      return { previousOpportunities };
    },
    onError: (error, deletedId, context) => {
      if (context?.previousOpportunities) {
        queryClient.setQueryData(
          ['opportunities', params],
          context.previousOpportunities
        );
      }
      console.error('Error deleting opportunity:', error);
    },
    onSettled: (_, __, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.removeQueries({ queryKey: ['opportunity', deletedId] });
    },
  });

  return {
    opportunities: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.status === 'error',
    error: query.error,
    refetch: query.refetch,
    createOpportunity: createMutation.mutate,
    updateOpportunity: updateMutation.mutate,
    deleteOpportunity: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
}

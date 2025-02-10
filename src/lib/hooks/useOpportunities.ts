import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';

type Opportunity = Database['public']['Tables']['opportunities']['Row'];

export function useOpportunities() {
  const { user } = useAuth();

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Opportunity[];
    },
    enabled: !!user,
  });

  return {
    opportunities,
    isLoading,
  };
}

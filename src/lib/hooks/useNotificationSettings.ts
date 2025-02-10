import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';

export function useNotificationSettings(userId: string) {
  return useQuery({
    queryKey: ['notification-settings', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

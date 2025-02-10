import { useEffect } from 'react';

import { supabase } from '@/lib/supabase/client';

export function useSession() {
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Handle auth state changes
      console.log('Auth state changed:', session);
    });

    return () => subscription.unsubscribe();
  }, []);
}

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useEffect } from 'react';

// Import our custom ThemeProvider instead of MUI's
import { ThemeProvider } from '@/app/styles/theme/ThemeContext';
import { AuthProvider } from '@/lib/auth/AuthContext';

import { SupabaseProvider } from './SupabaseProvider';
import { ToastProvider } from './ToastProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Log React Query events (useful for debugging auth cycles)
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      // Only log events related to auth queries
      if (
        event.query &&
        Array.isArray(event.query.queryKey) &&
        event.query.queryKey[0] === 'authenticated-user'
      ) {
        // Simplified logging for auth query events
        console.log(`🔍 [React Query] Auth query: ${event.type}`, {
          status: event.query.state.status,
          fetchStatus: event.query.state.fetchStatus,
          hasData: !!event.query.state.data,
          timestamp: new Date().toISOString(),
        });
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Use our custom ThemeProvider which includes context for theme mode */}
      <ThemeProvider>
        <SupabaseProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
              <ReactQueryDevtools initialIsOpen={false} />
            </ToastProvider>
          </AuthProvider>
        </SupabaseProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

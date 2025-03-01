// TODO: Routes to be implemented in future versions:
// - /admin/analytics: Analytics dashboard for admins
// - /admin/reports: Report generation and management
// - /admin/logs: System logs and activity tracking
// - /help: Help and documentation center

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { type ReactNode, useState, useRef, useEffect } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Create a ref to store client-side initialized QueryClient
  const queryClientRef = useRef<QueryClient | null>(null);
  // State to track if we're on the client
  const [isClient, setIsClient] = useState(false);
  
  // Initialize query client only on the client side
  useEffect(() => {
    if (!queryClientRef.current) {
      queryClientRef.current = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            refetchOnWindowFocus: false,
            retry: 1,
            networkMode: 'offlineFirst',
            refetchOnMount: true, 
            refetchOnReconnect: true,
          },
        },
      });
    }
    setIsClient(true);
  }, []);
  
  // Return an empty fragment during SSR/first render to avoid hydration mismatches
  if (!isClient) {
    return <>{children}</>;
  }
  
  return (
    <QueryClientProvider client={queryClientRef.current!}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

'use client';

import { type QueryClient } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import React, { useState } from 'react';

import { auth } from '@/lib/firebase/config';

import { trpc } from './client';
import { getUrl } from './client';

interface TRPCProviderProps {
  children: React.ReactNode;
  queryClient: QueryClient;
}

export function TRPCProvider({ children, queryClient }: TRPCProviderProps) {
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: getUrl(),
          async headers() {
            const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
            return {
              authorization: token ? `Bearer ${token}` : '',
            };
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      {children}
    </trpc.Provider>
  );
}

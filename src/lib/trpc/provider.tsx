'use client';

import { QueryClient } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';

import { auth } from '@/lib/firebase/config';

import { trpc } from './client';
import { getBaseUrl } from './client';

export function TRPCProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
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
  const [queryClient] = useState(() => new QueryClient());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      {children}
    </trpc.Provider>
  );
}

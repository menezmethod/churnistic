import { TRPCClient } from '@trpc/client';

import type { AppRouter } from '@/api/routers/_app';

declare module '@/lib/trpc' {
  interface TRPCClientWithRouters extends TRPCClient<AppRouter> {
    user: {
      getProfile: {
        useQuery: () => {
          data: {
            id: string;
            email: string;
            role: string;
          };
          isLoading: boolean;
        };
      };
    };
    opportunity: {
      list: {
        useQuery: () => {
          data: {
            active: Array<{
              id: string;
              value: number;
              title: string;
              type: 'credit_card' | 'bank_account';
              confidence: number;
            }>;
            quick: Array<{
              id: string;
              value: number;
              title: string;
              type: 'credit_card' | 'bank_account';
              confidence: number;
            }>;
            totalValue: number;
            tracked: Array<{
              id: string;
              progress: number;
              target: number;
              daysLeft: number;
            }>;
          };
          isLoading: boolean;
        };
      };
    };
  }

  export const trpc: TRPCClientWithRouters;
}

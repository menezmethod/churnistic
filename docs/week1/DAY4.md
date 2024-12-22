# Day 4: Analytics & Bank Integration (Thursday)

## Core Principles

1. Minimal User Input
   - Automated data analysis
   - Smart visualizations
   - Quick insights
   - Easy filtering

2. Fast Development
   - Chart components
   - Data hooks
   - Reusable filters
   - Quick exports

## Morning Session (4 hours)

### 1. Analytics Dashboard

```typescript
// src/components/analytics/bonus-chart.tsx
import { Line } from 'react-chartjs-2';
import { trpc } from '@/lib/trpc';

export function BonusChart() {
  const { data } = trpc.analytics.getBonusStats.useQuery({
    timeframe: '6months'
  });

  const chartData = {
    labels: data?.map(d => d.month) ?? [],
    datasets: [
      {
        label: 'Total Earned',
        data: data?.map(d => d.earned) ?? [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      },
      {
        label: 'Pending',
        data: data?.map(d => d.pending) ?? [],
        borderColor: 'rgb(255, 159, 64)',
        tension: 0.1
      }
    ]
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">Bonus Earnings</h3>
      <Line data={chartData} options={chartOptions} />
    </div>
  );
}

// src/components/analytics/bank-stats.tsx
export function BankStats() {
  const { data: stats } = trpc.analytics.getBankStats.useQuery();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stats?.map(bank => (
        <div key={bank.name} className="p-4 bg-white rounded-lg shadow">
          <h4 className="font-medium">{bank.name}</h4>
          <p className="text-2xl font-bold">${bank.totalEarned}</p>
          <div className="mt-2 text-sm text-gray-500">
            <span>{bank.successRate}% success rate</span>
            <span className="mx-2">•</span>
            <span>{bank.bonusCount} bonuses</span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 2. Analytics Service

```typescript
// src/server/services/analytics.ts
import { prisma } from '@/lib/prisma';

export class AnalyticsService {
  async getBonusStats(userId: string, timeframe: string) {
    const startDate = this.getStartDate(timeframe);
    
    const bonuses = await prisma.bonus.findMany({
      where: {
        userId,
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'asc' }
    });

    return this.aggregateByMonth(bonuses);
  }

  async getBankStats(userId: string) {
    const bonuses = await prisma.bonus.findMany({
      where: { userId },
      include: { bank: true }
    });

    return this.aggregateByBank(bonuses);
  }

  private getStartDate(timeframe: string): Date {
    const date = new Date();
    switch (timeframe) {
      case '1month':
        date.setMonth(date.getMonth() - 1);
        break;
      case '6months':
        date.setMonth(date.getMonth() - 6);
        break;
      case '1year':
        date.setFullYear(date.getFullYear() - 1);
        break;
      default:
        date.setMonth(date.getMonth() - 6);
    }
    return date;
  }

  private aggregateByMonth(bonuses: any[]) {
    const months: Record<string, { earned: number; pending: number }> = {};
    
    bonuses.forEach(bonus => {
      const month = new Date(bonus.createdAt).toLocaleString('default', { 
        month: 'short', 
        year: 'numeric' 
      });
      
      if (!months[month]) {
        months[month] = { earned: 0, pending: 0 };
      }
      
      if (bonus.status === 'completed') {
        months[month].earned += bonus.amount;
      } else {
        months[month].pending += bonus.amount;
      }
    });

    return Object.entries(months).map(([month, stats]) => ({
      month,
      ...stats
    }));
  }

  private aggregateByBank(bonuses: any[]) {
    const banks: Record<string, {
      totalEarned: number;
      bonusCount: number;
      successCount: number;
    }> = {};

    bonuses.forEach(bonus => {
      const bankName = bonus.bank.name;
      
      if (!banks[bankName]) {
        banks[bankName] = {
          totalEarned: 0,
          bonusCount: 0,
          successCount: 0
        };
      }
      
      banks[bankName].bonusCount++;
      
      if (bonus.status === 'completed') {
        banks[bankName].totalEarned += bonus.amount;
        banks[bankName].successCount++;
      }
    });

    return Object.entries(banks).map(([name, stats]) => ({
      name,
      ...stats,
      successRate: Math.round((stats.successCount / stats.bonusCount) * 100)
    }));
  }
}
```

## Afternoon Session (4 hours)

### 3. Bank Integration

```typescript
// src/server/services/plaid.ts
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

export class PlaidService {
  private client: PlaidApi;

  constructor() {
    const config = new Configuration({
      basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments],
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
          'PLAID-SECRET': process.env.PLAID_SECRET,
        },
      },
    });

    this.client = new PlaidApi(config);
  }

  async createLinkToken(userId: string) {
    const response = await this.client.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'Churnistic',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en'
    });

    return response.data;
  }

  async exchangePublicToken(publicToken: string) {
    const response = await this.client.itemPublicTokenExchange({
      public_token: publicToken
    });

    return response.data;
  }

  async getTransactions(accessToken: string, startDate: string, endDate: string) {
    const response = await this.client.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate
    });

    return response.data;
  }
}

// src/server/routers/bank.ts
export const bankRouter = router({
  createLinkToken: protectedProcedure
    .mutation(async ({ ctx }) => {
      const plaid = new PlaidService();
      return plaid.createLinkToken(ctx.user.id);
    }),

  setAccessToken: protectedProcedure
    .input(z.object({
      publicToken: z.string(),
      bankId: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const plaid = new PlaidService();
      const { access_token } = await plaid.exchangePublicToken(input.publicToken);

      return prisma.bankConnection.create({
        data: {
          userId: ctx.user.id,
          bankId: input.bankId,
          accessToken: access_token,
          status: 'active'
        }
      });
    }),

  syncTransactions: protectedProcedure
    .input(z.object({
      bankId: z.string(),
      startDate: z.string(),
      endDate: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const connection = await prisma.bankConnection.findFirst({
        where: {
          userId: ctx.user.id,
          bankId: input.bankId
        }
      });

      if (!connection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Bank connection not found'
        });
      }

      const plaid = new PlaidService();
      const { transactions } = await plaid.getTransactions(
        connection.accessToken,
        input.startDate,
        input.endDate
      );

      // Store transactions
      await prisma.transaction.createMany({
        data: transactions.map(t => ({
          userId: ctx.user.id,
          bankId: input.bankId,
          amount: t.amount,
          date: new Date(t.date),
          description: t.name,
          category: t.category[0],
          pending: t.pending
        }))
      });

      return transactions.length;
    })
});
```

### 4. Bank Connection UI

```typescript
// src/components/banks/connect-bank.tsx
'use client';

import { usePlaidLink } from 'react-plaid-link';
import { trpc } from '@/lib/trpc';

export function ConnectBank({ bankId }: { bankId: string }) {
  const { data: linkToken } = trpc.bank.createLinkToken.useQuery();
  const setAccessToken = trpc.bank.setAccessToken.useMutation();

  const { open, ready } = usePlaidLink({
    token: linkToken?.link_token,
    onSuccess: async (public_token) => {
      await setAccessToken.mutateAsync({
        publicToken: public_token,
        bankId
      });
    }
  });

  return (
    <Button
      onClick={() => open()}
      disabled={!ready}
      loading={!linkToken}
    >
      Connect Bank
    </Button>
  );
}

// src/app/dashboard/banks/page.tsx
export default function BanksPage() {
  const { data: banks } = trpc.bank.list.useQuery();
  const { data: connections } = trpc.bank.getConnections.useQuery();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Connected Banks</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {banks?.map(bank => {
          const isConnected = connections?.some(c => c.bankId === bank.id);
          
          return (
            <div key={bank.id} className="p-4 bg-white rounded-lg shadow">
              <h3 className="font-medium">{bank.name}</h3>
              {isConnected ? (
                <Badge>Connected</Badge>
              ) : (
                <ConnectBank bankId={bank.id} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

## End of Day Verification

### 1. Test Analytics

```bash
# Check analytics endpoints
curl http://localhost:3000/api/trpc/analytics.getBonusStats \
  -H "Content-Type: application/json" \
  -d '{"timeframe": "6months"}'

# Verify charts
npm run test src/components/analytics
```

### 2. Verify Bank Integration

```bash
# Test Plaid connection
npm run test:integration src/server/services/plaid.test.ts

# Check transaction sync
curl -X POST http://localhost:3000/api/trpc/bank.syncTransactions \
  -H "Content-Type: application/json" \
  -d '{"bankId": "test", "startDate": "2024-01-01", "endDate": "2024-01-31"}'
```

### 3. UI Testing

```bash
# Run Storybook
npm run storybook

# Test bank connection flow
npm run cypress
```

## Next Steps

1. Mobile UI (Day 5)
2. Final Testing (Day 5)
3. Deployment Prep (Day 5)
4. Documentation (Day 5)
```

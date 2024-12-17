# Day 4: Customer Dashboard & Analytics (Thursday)

## Overview

Focus on implementing the customer dashboard, analytics foundation, and risk calculation system.

## Session Plan

### Morning Session (3 hours)

#### 1. Customer Dashboard Page

```typescript
// src/app/dashboard/customers/page.tsx
import { Suspense } from 'react';
import { CustomerList } from '@/components/customers/customer-list';
import { CustomerStats } from '@/components/customers/customer-stats';
import { NewCustomerButton } from '@/components/customers/new-customer-button';

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Customers</h1>
        <NewCustomerButton />
      </div>

      <Suspense fallback={<div>Loading stats...</div>}>
        <CustomerStats />
      </Suspense>

      <Suspense fallback={<div>Loading customers...</div>}>
        <CustomerList />
      </Suspense>
    </div>
  );
}
```

Commit: `feat: implement customers dashboard page`

#### 2. Customer List Component

```typescript
// src/components/customers/customer-list.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/ui/data-table';
import { trpc } from '@/lib/trpc/client';

export function CustomerList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = trpc.customer.list.useQuery({
    page,
    limit: 10,
    search,
  });

  const columns = [
    {
      key: 'name',
      header: 'Name',
      cell: (row) => (
        <div className="flex items-center">
          <span className="font-medium">{row.name}</span>
          <span className="ml-2 text-gray-500">{row.company}</span>
        </div>
      ),
    },
    {
      key: 'riskScore',
      header: 'Risk Score',
      cell: (row) => (
        <div className={`inline-flex px-2 py-1 rounded-full ${
          row.riskScore > 70 ? 'bg-red-100 text-red-800' :
          row.riskScore > 30 ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {row.riskScore}%
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <span className={`capitalize ${
          row.status === 'active' ? 'text-green-600' :
          row.status === 'at_risk' ? 'text-yellow-600' :
          'text-red-600'
        }`}>
          {row.status.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (row) => (
        <button
          onClick={() => router.push(`/dashboard/customers/${row.id}`)}
          className="text-blue-600 hover:text-blue-800"
        >
          View Details
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <input
          type="text"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.customers ?? []}
        loading={isLoading}
      />

      {data && (
        <Pagination
          currentPage={page}
          totalPages={data.pages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
```

Commit: `feat: add customer list component with search and filtering`

### Mid-Morning Session (2 hours)

#### 3. Customer Stats Component

```typescript
// src/components/customers/customer-stats.tsx
'use client';

import { trpc } from '@/lib/trpc/client';
import { Card } from '@/components/ui/card';
import { TrendingUpIcon, TrendingDownIcon } from 'lucide-react';

export function CustomerStats() {
  const { data } = trpc.customer.stats.useQuery();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <div className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Total Customers</h3>
          <p className="mt-2 text-3xl font-semibold">{data?.totalCustomers}</p>
          <div className="mt-2 text-sm text-gray-600">
            <span className="text-green-600">↑ {data?.newThisMonth}</span> this month
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h3 className="text-sm font-medium text-gray-500">At Risk</h3>
          <p className="mt-2 text-3xl font-semibold text-red-600">
            {data?.atRiskCount}
          </p>
          <div className="mt-2 text-sm text-gray-600">
            {data?.atRiskPercentage}% of total
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h3 className="text-sm font-medium text-gray-500">Revenue at Risk</h3>
          <p className="mt-2 text-3xl font-semibold text-yellow-600">
            ${data?.revenueAtRisk.toLocaleString()}
          </p>
          <div className="mt-2 text-sm text-gray-600">
            Monthly recurring revenue
          </div>
        </div>
      </Card>
    </div>
  );
}
```

Commit: `feat: add customer statistics component`

### Afternoon Session (3 hours)

#### 4. Risk Calculation System

```typescript
// src/lib/analytics/risk-calculator.ts
interface RiskFactors {
  activityLevel: number; // 0-100
  supportTickets: number; // Count of open tickets
  billingIssues: boolean;
  featureUsage: number; // 0-100
}

export function calculateRiskScore(factors: RiskFactors): number {
  const weights = {
    activityLevel: 0.4,
    supportTickets: 0.2,
    billingIssues: 0.2,
    featureUsage: 0.2,
  };

  const scores = {
    activityLevel: normalizeActivityScore(factors.activityLevel),
    supportTickets: normalizeTicketScore(factors.supportTickets),
    billingIssues: factors.billingIssues ? 100 : 0,
    featureUsage: factors.featureUsage,
  };

  return Object.entries(weights).reduce((total, [factor, weight]) => {
    return total + scores[factor as keyof typeof scores] * weight;
  }, 0);
}

function normalizeActivityScore(level: number): number {
  return Math.max(0, 100 - level); // Lower activity = higher risk
}

function normalizeTicketScore(tickets: number): number {
  return Math.min(100, tickets * 20); // More tickets = higher risk
}

// src/server/routers/analytics.ts
export const analyticsRouter = router({
  calculateRisk: protectedProcedure
    .input(
      z.object({
        customerId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const [activities, tickets, billing] = await Promise.all([
        prisma.activity.findMany({
          where: {
            customerId: input.customerId,
            timestamp: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        prisma.supportTicket.count({
          where: {
            customerId: input.customerId,
            status: 'open',
          },
        }),
        prisma.billingIssue.findFirst({
          where: {
            customerId: input.customerId,
            resolved: false,
          },
        }),
      ]);

      const riskFactors = {
        activityLevel: calculateActivityLevel(activities),
        supportTickets: tickets,
        billingIssues: !!billing,
        featureUsage: calculateFeatureUsage(activities),
      };

      const riskScore = calculateRiskScore(riskFactors);

      await prisma.churnRisk.upsert({
        where: { customerId: input.customerId },
        update: {
          score: riskScore,
          indicators: riskFactors,
          trend: determineTrend(riskScore, activities),
        },
        create: {
          customerId: input.customerId,
          score: riskScore,
          indicators: riskFactors,
          trend: 'new',
        },
      });

      return { riskScore, factors: riskFactors };
    }),
});
```

Commit: `feat: implement risk calculation system`

### Evening Session (2 hours)

#### 5. Customer Profile Page

```typescript
// src/app/dashboard/customers/[id]/page.tsx
import { Suspense } from 'react';
import { CustomerHeader } from './customer-header';
import { CustomerActivity } from './customer-activity';
import { RiskAnalysis } from './risk-analysis';
import { NotFound } from '@/components/not-found';

export default async function CustomerPage({ params }: { params: { id: string } }) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      churnRisk: true,
      activities: {
        take: 10,
        orderBy: { timestamp: 'desc' },
      },
    },
  });

  if (!customer) {
    return <NotFound message="Customer not found" />;
  }

  return (
    <div className="space-y-6">
      <CustomerHeader customer={customer} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<div>Loading activity...</div>}>
            <CustomerActivity customerId={customer.id} />
          </Suspense>
        </div>

        <div>
          <Suspense fallback={<div>Loading risk analysis...</div>}>
            <RiskAnalysis customer={customer} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
```

Commit: `feat: add customer profile page with activity and risk analysis`

## Pull Requests

### PR #6: Customer Dashboard Implementation

```markdown
PR Title: feat: Customer Dashboard and Management

Description:
Implements the core customer management features:

- Customer dashboard with stats
- Customer list with search and filtering
- New customer creation flow
- Customer profile pages
- Basic analytics integration

Changes:

- Add customer dashboard page
- Create customer list component
- Implement customer statistics
- Add new customer dialog
- Create customer profile view
- Set up basic analytics

Testing Steps:

1. Start development server
2. Test customer list:
   - Verify pagination works
   - Test search functionality
   - Check sorting and filtering
3. Test customer creation:
   - Create new customer
   - Verify validation
   - Check error handling
4. Test customer profile:
   - View customer details
   - Check activity history
   - Verify risk analysis

UI/UX Considerations:

- Responsive design for all views
- Loading states and error handling
- Intuitive navigation
- Clear data visualization

Performance Considerations:

- Pagination for large datasets
- Optimistic updates
- Proper query invalidation
- Efficient data fetching

Related Issues:
Closes #6 - Customer Dashboard Implementation
```

### PR #7: Analytics Foundation

````markdown
PR Title: feat: Analytics Foundation and Risk Calculation

Description:
Sets up the foundation for analytics and risk calculation:

- Basic risk calculation algorithm
- Analytics data structures
- Initial metrics tracking
- Data visualization setup

Changes:

- Add analytics router
- Implement risk calculation
- Create analytics components
- Set up data aggregation
- Add visualization utilities

Testing Steps:

1. Generate test data:
   ```bash
   npx prisma db seed
   ```
````

2. Verify calculations:
   - Check risk scores
   - Verify metrics
   - Test aggregations
3. Test visualizations:
   - View charts
   - Check responsiveness
   - Verify data updates

Analytics Features:

- Customer risk scoring
- Activity analysis
- Revenue impact
- Trend identification

Related Issues:
Closes #7 - Analytics Foundation

```

## Day 4 Checklist
- [ ] Customer Dashboard Page
- [ ] Customer List Component
- [ ] Customer Stats
- [ ] Risk Calculation System
- [ ] Customer Profile
- [ ] Analytics Foundation
- [ ] Testing & Documentation

## Notes
- Monitor performance with larger datasets
- Consider caching strategy for analytics
- Plan for more advanced risk indicators
- Document risk calculation methodology
```

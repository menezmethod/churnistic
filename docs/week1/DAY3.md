# Day 3: API Foundation & UI Framework (Wednesday)

## Overview
Focus on building the API infrastructure with tRPC and setting up the core UI components.

## Session Plan

### Morning Session (3 hours)
#### 1. tRPC Server Setup
```typescript
// src/server/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import { auth } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

const t = initTRPC.create();

const isAuthenticated = t.middleware(async ({ next }) => {
  const session = cookies().get('session')?.value;
  
  if (!session) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  try {
    const decodedToken = await auth.verifySessionCookie(session);
    return next({
      ctx: {
        userId: decodedToken.uid,
      },
    });
  } catch {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthenticated);
```

Commit: `feat: set up tRPC server with authentication`

#### 2. Customer Router Implementation
```typescript
// src/server/routers/customer.ts
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { prisma } from '@/lib/prisma';

export const customerRouter = router({
  list: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(10),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const skip = (input.page - 1) * input.limit;
      const where = input.search ? {
        OR: [
          { name: { contains: input.search, mode: 'insensitive' } },
          { email: { contains: input.search, mode: 'insensitive' } },
          { company: { contains: input.search, mode: 'insensitive' } },
        ],
      } : {};

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          skip,
          take: input.limit,
          include: {
            churnRisk: true,
            _count: {
              select: { activities: true },
            },
          },
        }),
        prisma.customer.count({ where }),
      ]);

      return {
        customers,
        total,
        pages: Math.ceil(total / input.limit),
      };
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      email: z.string().email(),
      company: z.string(),
      industry: z.string(),
    }))
    .mutation(async ({ input }) => {
      return prisma.customer.create({
        data: input,
      });
    }),
});
```

Commit: `feat: implement customer API router`

### Mid-Morning Session (2 hours)
#### 3. UI Component Setup
```bash
# Install shadcn-ui
npx shadcn-ui@latest init

# Add core components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add table
```

```typescript
// src/components/ui/data-table.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DataTableProps<T> {
  columns: Array<{
    key: keyof T;
    header: string;
    cell?: (row: T) => React.ReactNode;
  }>;
  data: T[];
  loading?: boolean;
}

export function DataTable<T>({ columns, data, loading }: DataTableProps<T>) {
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.key as string}>{column.header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, i) => (
          <TableRow key={i}>
            {columns.map((column) => (
              <TableCell key={column.key as string}>
                {column.cell ? column.cell(row) : row[column.key]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

Commit: `feat: add core UI components and data table`

### Afternoon Session (3 hours)
#### 4. Layout Implementation
```typescript
// src/components/layout/dashboard-layout.tsx
import { SideNav } from './side-nav';
import { TopBar } from './top-bar';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <TopBar />
      <div className="flex">
        <SideNav />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

// src/components/layout/side-nav.tsx
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Customers', href: '/dashboard/customers', icon: UsersIcon },
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: CogIcon },
];
```

Commit: `feat: implement dashboard layout components`

### Evening Session (2 hours)
#### 5. API Documentation
```typescript
// src/types/api.ts
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  pages: number;
  currentPage: number;
}

export interface CustomerResponse {
  id: string;
  name: string;
  email: string;
  company: string;
  industry: string;
  status: string;
  riskScore: number;
  churnRisk?: {
    score: number;
    trend: string;
    indicators: Record<string, boolean>;
  };
  activityCount: number;
  createdAt: string;
  updatedAt: string;
}
```

Commit: `feat: add API type definitions and documentation`

## Pull Requests

### PR #4: API Foundation
```markdown
PR Title: feat: API Foundation with tRPC

Description:
Implements the core API infrastructure using tRPC:
- Server setup with authentication
- Customer router implementation
- Type-safe API endpoints
- API documentation

Changes:
- Add tRPC server configuration
- Implement customer router
- Add authentication middleware
- Create API type definitions
- Add API documentation

Testing Steps:
1. Start development server
2. Test authenticated endpoints:
   ```bash
   curl -X POST http://localhost:3000/api/trpc/customer.list \
     -H "Content-Type: application/json" \
     -H "Cookie: session=<valid-session>" \
     -d '{"page": 1, "limit": 10}'
   ```
3. Verify error handling:
   - Test without authentication
   - Test with invalid inputs
   - Test pagination

API Endpoints Added:
- customer.list: Get paginated customer list
- customer.create: Create new customer
- customer.get: Get customer details
- customer.update: Update customer details

Related Issues:
Closes #4 - API Foundation Implementation
```

### PR #5: UI Framework
```markdown
PR Title: feat: UI Framework and Layout Components

Description:
Sets up the core UI framework and layout components:
- shadcn/ui integration
- Dashboard layout
- Reusable components
- Type-safe UI components

Changes:
- Add shadcn/ui components
- Create dashboard layout
- Implement navigation
- Add data table component
- Create type definitions

Testing Steps:
1. Start development server
2. Verify component styling:
   - Check dark/light mode
   - Test responsive layout
   - Verify component interactions
3. Test layout functionality:
   - Navigation works
   - Sidebar collapses
   - Header is fixed

UI Components Added:
- DataTable
- DashboardLayout
- SideNav
- TopBar
- Common UI components

Related Issues:
Closes #5 - UI Framework Implementation
```

## Day 3 Checklist
- [ ] tRPC Server Setup
- [ ] Customer Router
- [ ] UI Components
- [ ] Layout Implementation
- [ ] API Documentation
- [ ] Testing & Validation
- [ ] PR Reviews & Merges

## Notes
- Document API endpoints thoroughly
- Consider rate limiting for API routes
- Test component accessibility
- Plan for error boundary implementation 
# Day 1: Project Setup & Verification (Monday)

## Core Principles

1. Speed of Development

   - Minimal configuration
   - Essential tools only
   - Quick iterations
   - Fast feedback

2. Minimal User Input
   - Smart defaults
   - Automated setup
   - Clear structure
   - Simple workflow

## Morning Session (2 hours)

### 1. Verify Project Setup

```bash
# Verify dependencies
npm ls @prisma/client @trpc/server firebase cheerio

# Check TypeScript configuration
npm run type-check

# Verify environment
node -e "console.log(require('dotenv').config())"
```

### 2. Complete Database Setup

```bash
# Test database connection
npx prisma db push

# Verify schema
npx prisma generate
npx prisma studio

# Add test data
npx prisma db seed
```

## Afternoon Session (6 hours)

### 3. Complete Auth Flow

```typescript
// src/lib/firebase/auth.ts
import { auth } from './config';

export async function verifyAuth() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const token = await user.getIdToken();
  return { user, token };
}

// src/middleware.ts
import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/firebase/auth';

export async function middleware(request: NextRequest) {
  try {
    await verifyAuth();
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

### 4. Complete Bonus Router

```typescript
// src/server/routers/bonus.ts
export const bonusRouter = router({
  quickAdd: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // 1. Extract bonus details from URL
      const details = await scrapeBonusPage(input.url);

      // 2. Format requirements
      const requirements = formatRequirements(details.requirements);

      // 3. Create bonus
      return prisma.bonus.create({
        data: {
          userId: ctx.user.id,
          bankId: details.bank,
          amount: details.amount,
          requirements,
          startDate: new Date(),
          targetDate: details.expiration || addMonths(new Date(), 3),
          source: { url: input.url },
        },
      });
    }),

  getActive: protectedProcedure.query(async ({ ctx }) => {
    return prisma.bonus.findMany({
      where: {
        userId: ctx.user.id,
        status: { in: ['planned', 'in_progress'] },
      },
      orderBy: { targetDate: 'asc' },
    });
  }),
});

// Helper functions
function formatRequirements(raw: string[]): Record<string, any> {
  // Implement requirement parsing logic
  return {};
}

function addMonths(date: Date, months: number): Date {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
}
```

## End of Day Verification

### 1. Test Database

```bash
# Create test user
npx prisma studio
# Add test user manually

# Verify queries
npm run test:db
```

### 2. Test Auth Flow

```bash
# Start dev server
npm run dev

# Test protected routes
curl http://localhost:3000/api/trpc/bonus.getActive \
  -H "Authorization: Bearer TEST_TOKEN"
```

### 3. Test API Endpoints

```bash
# Test quick add
curl http://localhost:3000/api/trpc/bonus.quickAdd \
  -H "Content-Type: application/json" \
  -d '{"url": "https://doctorofcredit.com/..."}'

# Verify bonus creation
curl http://localhost:3000/api/trpc/bonus.getActive
```

### 4. Verify Types

```bash
# Run type checks
npm run type-check

# Generate API types
npm run generate:types
```

## Next Steps

1. Browser Extension Setup (Day 2)
2. Scraping Implementation (Day 2)
3. Quick Add Interface (Day 2)
4. Progress Tracking (Day 2)

# Day 5: Mobile UI, Testing & Deployment (Friday)

## Core Principles

1. Minimal User Input
   - Mobile-first design
   - Touch-friendly UI
   - Quick actions
   - Automated testing

2. Fast Development
   - Reusable components
   - Automated deployment
   - CI/CD pipeline
   - Documentation

## Morning Session (4 hours)

### 1. Mobile UI Components

```typescript
// src/components/mobile/bottom-nav.tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  HomeIcon, 
  CreditCardIcon, 
  BankIcon, 
  ChartIcon 
} from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  const links = [
    {
      href: '/dashboard',
      icon: HomeIcon,
      label: 'Home'
    },
    {
      href: '/dashboard/cards',
      icon: CreditCardIcon,
      label: 'Cards'
    },
    {
      href: '/dashboard/banks',
      icon: BankIcon,
      label: 'Banks'
    },
    {
      href: '/dashboard/analytics',
      icon: ChartIcon,
      label: 'Analytics'
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
      <div className="grid grid-cols-4 h-16">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center justify-center ${
              pathname === link.href ? 'text-blue-600' : 'text-gray-600'
            }`}
          >
            <link.icon className="h-6 w-6" />
            <span className="text-xs mt-1">{link.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

// src/components/mobile/swipe-card.tsx
'use client';

import { useState } from 'react';
import { motion, PanInfo } from 'framer-motion';

interface SwipeCardProps {
  onSwipe: (direction: 'left' | 'right') => void;
  children: React.ReactNode;
}

export function SwipeCard({ onSwipe, children }: SwipeCardProps) {
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleDragStart = (e: MouseEvent | TouchEvent | PointerEvent) => {
    setDragStart({
      x: e instanceof TouchEvent ? e.touches[0].clientX : e.clientX,
      y: e instanceof TouchEvent ? e.touches[0].clientY : e.clientY
    });
  };

  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    const direction = info.offset.x > threshold ? 'right' : 
                     info.offset.x < -threshold ? 'left' : null;
    
    if (direction) {
      onSwipe(direction);
    }
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="touch-none"
    >
      {children}
    </motion.div>
  );
}

// src/components/mobile/pull-to-refresh.tsx
'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [refreshing, setRefreshing] = useState(false);
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 50], [0, 1]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      onDragEnd={(e, info) => {
        if (info.offset.y > 50 && !refreshing) {
          handleRefresh();
        }
      }}
    >
      <motion.div
        style={{ opacity }}
        className="flex justify-center py-2"
      >
        {refreshing ? 'Refreshing...' : 'Pull to refresh'}
      </motion.div>
      {children}
    </motion.div>
  );
}
```

### 2. Mobile Layouts

```typescript
// src/app/layout.tsx
import { BottomNav } from '@/components/mobile/bottom-nav';

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="pb-16 md:pb-0">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}

// src/app/dashboard/cards/page.tsx
import { SwipeCard } from '@/components/mobile/swipe-card';
import { PullToRefresh } from '@/components/mobile/pull-to-refresh';

export default function CardsPage() {
  const handleSwipe = (direction: 'left' | 'right') => {
    // Handle card swipe
  };

  const handleRefresh = async () => {
    // Refresh card data
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Credit Cards</h1>
        
        <div className="space-y-4">
          {cards.map(card => (
            <SwipeCard key={card.id} onSwipe={handleSwipe}>
              <div className="p-4 bg-white rounded-lg shadow">
                <h3 className="font-medium">{card.name}</h3>
                <p className="text-sm text-gray-500">{card.bank}</p>
                <div className="mt-2">
                  <span className="text-green-600">${card.bonus}</span>
                  <span className="mx-2">•</span>
                  <span>{card.spend} spend required</span>
                </div>
              </div>
            </SwipeCard>
          ))}
        </div>
      </div>
    </PullToRefresh>
  );
}
```

## Afternoon Session (4 hours)

### 3. Testing Setup

```typescript
// src/tests/setup.ts
import '@testing-library/jest-dom';
import { server } from './mocks/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// src/tests/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/trpc/card.list', (req, res, ctx) => {
    return res(
      ctx.json({
        cards: [
          {
            id: '1',
            name: 'Chase Sapphire Preferred',
            bank: 'Chase',
            bonus: 60000,
            spend: 4000
          }
        ]
      })
    );
  }),
  
  rest.post('/api/trpc/card.apply', (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        applicationId: '123'
      })
    );
  })
];

// src/tests/components/card-list.test.tsx
import { render, screen } from '@testing-library/react';
import { CardList } from '@/components/cards/card-list';

describe('CardList', () => {
  it('renders cards correctly', async () => {
    render(<CardList />);
    
    expect(await screen.findByText('Chase Sapphire Preferred')).toBeInTheDocument();
    expect(screen.getByText('$60,000')).toBeInTheDocument();
    expect(screen.getByText('$4,000 spend required')).toBeInTheDocument();
  });
});

// cypress/e2e/card-application.cy.ts
describe('Card Application', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/dashboard/cards');
  });

  it('allows users to apply for a card', () => {
    cy.contains('Chase Sapphire Preferred')
      .parent()
      .within(() => {
        cy.contains('Apply').click();
      });

    cy.get('form').within(() => {
      cy.get('input[name="income"]').type('75000');
      cy.get('input[name="address"]').type('123 Main St');
      cy.contains('Submit').click();
    });

    cy.contains('Application submitted successfully').should('be.visible');
  });
});
```

### 4. Deployment Setup

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: vercel/actions/cli@v2
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'

# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/churnistic
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:14
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=churnistic
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:

# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
CMD ["npm", "start"]
```

## End of Day Verification

### 1. Test Mobile UI

```bash
# Run Storybook for mobile components
npm run storybook

# Test responsive design
npm run dev
open http://localhost:3000
```

### 2. Run Test Suite

```bash
# Unit tests
npm run test

# E2E tests
npm run cypress

# Coverage report
npm run test:coverage
```

### 3. Verify Deployment

```bash
# Build and run Docker
docker-compose up --build

# Test production build
npm run build
npm run start
```

## Next Steps

1. Week 2 Planning
2. Feature Prioritization
3. Performance Optimization
4. User Feedback Collection
```

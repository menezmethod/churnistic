# Day 5: Testing, Documentation & Deployment Prep (Friday)

## Overview
Focus on implementing tests, finalizing documentation, and preparing for deployment.

## Session Plan

### Morning Session (3 hours)
#### 1. Test Environment Setup
```bash
# Install testing dependencies
npm install -D jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @testing-library/react-hooks msw
npm install -D ts-jest @types/jest jest-environment-jsdom

# Configure Jest
cat << EOF > jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

module.exports = createJestConfig(customJestConfig)
EOF

# Create Jest setup file
cat << EOF > jest.setup.js
import '@testing-library/jest-dom'
import { server } from './src/mocks/server'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
EOF
```

Commit: `chore: set up testing environment with Jest and Testing Library`

#### 2. API Mocking Setup
```typescript
// src/mocks/handlers.ts
import { rest } from 'msw'

export const handlers = [
  rest.post('/api/trpc/customer.list', (req, res, ctx) => {
    return res(
      ctx.json({
        result: {
          data: {
            customers: [
              {
                id: '1',
                name: 'Test Company',
                email: 'test@example.com',
                status: 'active',
                riskScore: 30,
              },
            ],
            total: 1,
            pages: 1,
          },
        },
      })
    )
  }),
]

// src/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

Commit: `feat: add API mocking with MSW`

#### 3. Component Tests
```typescript
// src/components/customers/__tests__/customer-list.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CustomerList } from '../customer-list'
import { trpc } from '@/lib/trpc/client'

jest.mock('@/lib/trpc/client', () => ({
  customer: {
    list: {
      useQuery: jest.fn(),
    },
  },
}))

describe('CustomerList', () => {
  it('renders customer list with search and pagination', async () => {
    const mockData = {
      customers: [
        {
          id: '1',
          name: 'Test Company',
          email: 'test@example.com',
          status: 'active',
          riskScore: 30,
        },
      ],
      total: 1,
      pages: 1,
    }

    ;(trpc.customer.list.useQuery as jest.Mock).mockReturnValue({
      data: mockData,
      isLoading: false,
    })

    render(<CustomerList />)

    expect(screen.getByPlaceholderText('Search customers...')).toBeInTheDocument()
    expect(screen.getByText('Test Company')).toBeInTheDocument()
  })

  it('handles search functionality', async () => {
    render(<CustomerList />)
    const searchInput = screen.getByPlaceholderText('Search customers...')
    
    fireEvent.change(searchInput, { target: { value: 'test' } })
    
    await waitFor(() => {
      expect(trpc.customer.list.useQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'test',
        })
      )
    })
  })
})

// src/lib/analytics/__tests__/risk-calculator.test.ts
import { calculateRiskScore } from '../risk-calculator'

describe('Risk Calculator', () => {
  it('calculates high risk score for inactive customers', () => {
    const factors = {
      activityLevel: 10,
      supportTickets: 5,
      billingIssues: true,
      featureUsage: 20,
    }

    const score = calculateRiskScore(factors)
    expect(score).toBeGreaterThan(70)
  })

  it('calculates low risk score for active customers', () => {
    const factors = {
      activityLevel: 90,
      supportTickets: 0,
      billingIssues: false,
      featureUsage: 80,
    }

    const score = calculateRiskScore(factors)
    expect(score).toBeLessThan(30)
  })
})
```

Commit: `feat: add component and utility tests`

### Mid-Morning Session (2 hours)
#### 4. Integration Tests
```typescript
// src/tests/integration/customer-flow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CustomerDashboard } from '@/app/dashboard/customers/page'
import { AuthProvider } from '@/lib/firebase/auth-context'
import { trpc } from '@/lib/trpc/client'

jest.mock('@/lib/trpc/client')

describe('Customer Management Flow', () => {
  beforeEach(() => {
    // Mock authentication
    const mockUser = {
      uid: '123',
      email: 'test@example.com',
    }

    jest.spyOn(AuthProvider, 'useAuth').mockReturnValue({
      user: mockUser,
      loading: false,
    })
  })

  it('completes full customer management flow', async () => {
    // Mock API responses
    const mockCustomer = {
      id: '1',
      name: 'New Customer',
      email: 'customer@example.com',
      status: 'active',
      riskScore: 0,
    }

    trpc.customer.create.useMutation.mockReturnValue({
      mutate: jest.fn().mockResolvedValue(mockCustomer),
      isLoading: false,
    })

    render(<CustomerDashboard />)

    // Test customer creation
    fireEvent.click(screen.getByText('Add Customer'))
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'New Customer' },
    })
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'customer@example.com' },
    })
    fireEvent.click(screen.getByText('Create'))

    await waitFor(() => {
      expect(screen.getByText('Customer created successfully')).toBeInTheDocument()
    })

    // Test customer search
    fireEvent.change(screen.getByPlaceholderText('Search customers...'), {
      target: { value: 'New Customer' },
    })

    await waitFor(() => {
      expect(screen.getByText('New Customer')).toBeInTheDocument()
    })

    // Test customer details view
    fireEvent.click(screen.getByText('View Details'))
    
    await waitFor(() => {
      expect(screen.getByText('Customer Details')).toBeInTheDocument()
      expect(screen.getByText('Risk Analysis')).toBeInTheDocument()
    })
  })
})
```

Commit: `feat: add integration tests for customer flows`

### Afternoon Session (3 hours)
#### 5. Deployment Configuration
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run test
      - run: npm run lint
      - run: npm run build

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      # Add deployment steps here

# docker/Dockerfile
FROM node:18-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]

# docker-compose.yml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: docker/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY}
      # Add other environment variables
```

Commit: `feat: add CI/CD and Docker configuration`

### Evening Session (2 hours)
#### 6. Documentation Updates
```markdown
# README.md Updates
## Development
- Add testing instructions
- Document deployment process
- Update environment variables

## API Documentation
- Document all endpoints
- Add request/response examples
- Include error handling

## Contributing Guidelines
- PR process
- Code style
- Testing requirements
```

Commit: `docs: update documentation with testing and deployment guides`

## Pull Requests

### PR #8: Testing Implementation
```markdown
PR Title: feat: Comprehensive Test Suite

Description:
Implements comprehensive testing infrastructure:
- Jest and Testing Library setup
- Component tests
- Integration tests
- API mocking
- CI configuration

Changes:
- Add test configuration
- Create test utilities
- Implement component tests
- Add integration tests
- Set up CI pipeline

Testing Steps:
1. Run test suite:
   ```bash
   npm run test
   ```
2. Verify coverage:
   ```bash
   npm run test:coverage
   ```
3. Check CI pipeline:
   - Push to feature branch
   - Verify tests pass
   - Check coverage reports

Coverage Requirements:
- Components: 80%
- Utils: 90%
- API Routes: 85%

Related Issues:
Closes #8 - Test Infrastructure
```

### PR #9: Deployment Configuration
```markdown
PR Title: feat: Deployment Setup

Description:
Sets up deployment infrastructure:
- Docker configuration
- CI/CD pipeline
- Environment management
- Production optimizations

Changes:
- Add Dockerfile
- Create docker-compose config
- Set up GitHub Actions
- Add deployment documentation

Deployment Steps:
1. Build Docker image:
   ```bash
   docker build -t churnistic .
   ```
2. Run containers:
   ```bash
   docker-compose up -d
   ```
3. Verify deployment:
   - Check health endpoints
   - Verify environment variables
   - Test production build

Infrastructure:
- Docker containers
- GitHub Actions
- MongoDB Atlas
- Firebase hosting

Related Issues:
Closes #9 - Deployment Configuration
```

## Day 5 Checklist
- [ ] Test Environment Setup
- [ ] Component Tests
- [ ] Integration Tests
- [ ] Deployment Config
- [ ] Documentation Updates
- [ ] Final Review
- [ ] Deployment Prep

## Notes
- Ensure all tests are passing
- Document deployment process
- Update environment variables
- Plan for monitoring setup 
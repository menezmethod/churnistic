# Churnistic

Churnistic is a platform that aggregates and analyzes real-world credit card churning success stories to provide actionable insights and personalized redemption strategies.

## 🎯 Core Mission

- Aggregate and analyze real-world churning success stories
- Transform raw data into actionable trip plans
- Provide personalized redemption strategies
- Track financial opportunities (bank bonuses, investments)
- Build a community-driven knowledge base

## 🎁 Quick Start

1. Prerequisites:
```bash
# Install Node.js 18+
# Install MongoDB 6+
```

2. Clone and Setup:
```bash
# Clone repository
git clone https://github.com/menezmethod/churnistic.git
cd churnistic

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials
```

3. Development:
```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 🧪 Testing

We maintain high test coverage requirements:

- Business Logic: 90%+ coverage
- API Routes: 85%+ coverage
- UI Components: 80%+ coverage
- Utility Functions: 75%+ coverage

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# CI environment
npm run test:ci
```

### Test Structure

```
src/
├── __tests__/          # Global test utilities
├── components/
│   └── __tests__/     # Component tests
├── server/
│   └── __tests__/     # API and business logic tests
└── lib/
    └── __tests__/     # Utility function tests
```

## 📚 Documentation

Our documentation is organized into the following sections:

- [Project Architecture](docs/architecture/README.md)
- [Development Guide](docs/development/README.md)
- [User Experience](docs/user-experience/README.md)
- [Testing Strategy](docs/testing/README.md)
- [Launch Plan](docs/launch/README.md)
- [Growth Strategy](docs/growth/README.md)

## 🚀 Development Timeline

### Phase 1: MVP (2 weeks)
- Week 1: Foundation & Setup
- Week 2: Core Features

### Phase 2: Enhancement (2 weeks)
- Week 3: Feature Completion
- Week 4: Polish & Launch

## 🛠 Tech Stack

- Frontend: Next.js + TypeScript
- Backend: Node.js + TypeScript
- Database: MongoDB
- API: tRPC
- Authentication: Firebase
- Testing: Jest + Testing Library
- IDE: Cursor
- AI: Claude 3.5 Sonnet

## 🔑 Key Features

- Real user experiences vs theoretical maximums
- Multi-source data aggregation
- Personalized recommendations
- Community validation
- Real-time updates

## 👥 Target Audience

### Primary
- Active churners
- Travel hackers
- Points/miles enthusiasts

### Secondary
- Travel planners
- Bank bonus seekers
- Credit card optimizers

## 📅 Contributing

This project is optimized for single-developer workflow with AI assistance. However, contributions are welcome! See our [Contributing Guide](docs/development/CONTRIBUTING.md).

## 📝 Common Commands

```bash
# Development
npm run dev

# Testing
npm test
npm run test:coverage

# Linting
npm run lint

# Build
npm run build

# Start production server
npm start
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 
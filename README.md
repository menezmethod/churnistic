# Churnistic

A modern credit card churning tracker built with Next.js, TypeScript, and Material-UI.

## Features

### Modern Dashboard

- Real-time opportunity tracking
- Activity timeline with filters
- Progress tracking with visualizations
- Quick access to high-value opportunities
- Responsive design for all devices

### AI-Powered Opportunity Detection

- Reddit and Twitter integration for opportunity discovery
- Advanced analysis using Groq LLM
- Automated confidence scoring with explanations
- Smart filtering and categorization
- Historical performance tracking

### Enhanced Security

- Multi-factor authentication
- Role-based access control
- Data encryption at rest and in transit
- Regular security audits
- Automated vulnerability scanning

### Developer Experience

- Type-safe API contracts with tRPC
- React Query for state management
- Comprehensive test coverage
- CI/CD pipeline with GitHub Actions
- Automated code quality checks
- Preview deployments with Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Firebase project
- Groq API key
- Vercel account (for deployments)

### Installation

```bash
# Clone the repository
git clone https://github.com/menezmethod/churnistic.git

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Check code quality
npm run lint
```

### Deployment

### Vercel Integration

The project is configured for seamless deployment with Vercel:

1. **Preview Deployments**
   - Automatic deployments for every PR
   - Unique URL for testing changes
   - Free tier optimized configuration

2. **Environment Setup**
   - Connect your GitHub repository to Vercel
   - Environment variables are automatically synced
   - No additional configuration needed

3. **Deployment Process**
   - Push to `develop` branch for staging
   - Merge to `main` for production
   - Preview deployments for all PRs

4. **Performance Optimizations**
   - Automatic static asset caching
   - Optimized serverless functions
   - Memory limits: 256MB
   - Function timeout: 5s

### Deployment Commands

```bash
# Deploy to Vercel
vercel

# Deploy to production
vercel --prod
```

## Architecture

### Tech Stack

- **Frontend**: Next.js, React, Material-UI
- **State Management**: React Query, tRPC
- **Backend**: Firebase (Firestore, Authentication)
- **AI Integration**: Groq SDK
- **Testing**: Jest, Cypress, React Testing Library
- **Deployment**: Vercel (Preview, Staging, Production)

### Key Components

1. **Opportunity Manager**
   - CRUD operations
   - Real-time updates
   - AI-powered analysis

2. **User Management**
   - Authentication
   - Role-based permissions
   - Security features

3. **Dashboard**
   - Data visualization
   - Performance tracking

### Infrastructure

1. **Vercel Configuration**
   - Preview deployments enabled
   - Optimized for free tier
   - Security headers configured
   - Asset caching enabled
   - Region: SFO1

2. **Environment Management**
   - Development: Local environment
   - Staging: Preview deployments
   - Production: Main branch deployments

## Development Workflow

### Code Quality

- TypeScript strict mode
- ESLint with custom rules
- Prettier for formatting
- Husky pre-commit hooks

### Testing

- Unit tests: 90%+ coverage
- Integration tests: 85%+ coverage
- E2E tests: 80%+ coverage
- Security tests: 100% coverage

### CI/CD

- Automated testing on pull requests
- Code quality checks
- Security scanning
- Deployment to staging/production

## Security Best Practices

### Authentication

- JWT-based authentication
- Refresh token rotation
- Session management
- Rate limiting

### Data Protection

- Field-level encryption
- Secure API endpoints
- Input validation
- Regular security audits

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests for new features
4. Run code quality checks
5. Create a pull request

## License

MIT

## Support

For support, please open an issue on GitHub or contact the maintainers.

# Test Update
- Testing statistics tracking workflow

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

- React Query v5 for state management
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

### Development Mode

When running in development or using Firebase emulators:

1. Start the emulators:

   ```bash
   npx firebase emulators:start --only firestore,auth --import=./firebase-data --export-on-exit
   ```

2. Set environment variables:

   ```bash
   NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true
   ```

3. The scraper will:
   - Skip Firestore operations
   - Use local storage exclusively
   - Maintain data persistence between runs

### Error Handling

The scraper implements robust error handling:

1. **Storage Failures**

   - Automatic fallback to local storage
   - Backup creation for corrupted files
   - Atomic write operations

2. **Scraping Errors**

   - Automatic retries with exponential backoff
   - Detailed error logging
   - Rate limit compliance

3. **Data Validation**
   - Schema validation for all offers
   - Automatic filtering of invalid data
   - Detailed validation logs

### Maintenance

Regular maintenance tasks:

1. **Clear Expired Offers**

   ```bash
   curl -X POST http://localhost:3000/api/bankrewards/expire
   ```

2. **Delete All Offers**

   ```bash
   curl -X DELETE http://localhost:3000/api/bankrewards
   ```

3. **Check Statistics**
   ```bash
   curl http://localhost:3000/api/bankrewards/stats
   ```

## Architecture

### Tech Stack

- **Frontend**: Next.js, React, Material-UI
- **State Management**: React Query
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

4. **BankRewards Scraper**
   - Web scraping
   - Data transformation
   - Offer caching

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

# Test Update v2

- Testing statistics tracking workflow with fixes

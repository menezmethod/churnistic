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

## BankRewards Scraper

A powerful web scraper for collecting and transforming bank reward offers. The scraper supports both local storage and Firestore integration, with automatic fallback mechanisms and comprehensive error handling.

### Features

- Concurrent scraping with configurable limits
- Rate limiting and retry mechanisms
- Proxy support for distributed scraping
- Local storage fallback
- Firestore integration (production)
- Emulator support for development
- Automatic data transformation
- Offer deduplication
- Status tracking (active/expired)

### Configuration

Add these environment variables to your `.env.local`:

```bash
# Scraping Configuration
BANKREWARDS_MAX_CONCURRENCY=2           # Number of concurrent requests
BANKREWARDS_MAX_REQUESTS_PER_MINUTE=20  # Rate limiting
BANKREWARDS_MAX_RETRIES=3               # Failed request retry attempts
BANKREWARDS_TIMEOUT_SECS=30             # Request timeout
BANKREWARDS_PROXY_URLS=[]               # Optional proxy URLs array
BANKREWARDS_USER_AGENT="Mozilla/5.0..." # Custom user agent
BANKREWARDS_STORAGE_DIR="./storage/bankrewards" # Local storage path
BANKREWARDS_LOG_LEVEL="info"            # Logging verbosity
```

### Storage Architecture

The scraper implements a dual-storage strategy:

1. **Local Storage**

   - JSON file-based storage
   - Automatic backup on corruption
   - Atomic write operations
   - Default path: `./data/bankrewards.json`

2. **Firestore Integration**
   - Production-only storage
   - Batch operations for performance
   - Automatic timestamps
   - Collection: `bankrewards`

### API Endpoints

1. **Collect Offers**

   ```bash
   POST /api/bankrewards/collect
   ```

   Starts the scraping process with configured parameters.

2. **Get All Offers**

   ```bash
   GET /api/bankrewards?format=detailed|simple
   ```

   Returns all offers. Use `format=detailed` for transformed data.

3. **Get Single Offer**

   ```bash
   GET /api/bankrewards/[id]
   ```

   Returns a specific offer by ID.

4. **Get Detailed Offer**
   ```bash
   GET /api/bankrewards/detailed/[id]
   ```
   Returns a transformed offer with additional metadata.

### Data Structures

1. **Basic Offer**

   ```typescript
   {
     id: string;
     title: string;
     type: 'CREDIT_CARD' | 'BANK_ACCOUNT';
     offer_link: string;
     value: number;
     metadata: {
       status: 'active' | 'expired';
       lastChecked: Date;
       lastUpdated: Date;
     }
   }
   ```

2. **Detailed Offer**
   ```typescript
   {
     ...BasicOffer;
     bonus: {
       description: string;
       requirements: string[];
       tiers?: {
         spend: number;
         reward: number;
       }[];
     };
     details: {
       fees: string[];
       availability: string[];
       expiration?: string;
     };
     images?: {
       logo?: string;
       card?: string;
     }
   }
   ```

### Example Usage

1. **Start Scraping**

   ```bash
   curl -X POST http://localhost:3000/api/bankrewards/collect
   ```

2. **Get All Offers (Simple)**

   ```bash
   curl http://localhost:3000/api/bankrewards
   ```

3. **Get All Offers (Detailed)**

   ```bash
   curl http://localhost:3000/api/bankrewards?format=detailed
   ```

4. **Get Single Offer**
   ```bash
   curl http://localhost:3000/api/bankrewards/[offer-id]
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

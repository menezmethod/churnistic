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

## Getting Started

### Prerequisites
- Node.js 20+
- npm 10+
- Firebase project
- Groq API key

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

## Architecture

### Tech Stack
- **Frontend**: Next.js, React, Material-UI
- **State Management**: React Query, tRPC
- **Backend**: Firebase (Firestore, Authentication)
- **AI Integration**: Groq SDK
- **Testing**: Jest, Cypress, React Testing Library

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
   - Customizable views

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

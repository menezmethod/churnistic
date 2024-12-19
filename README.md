# Churnistic

A modern credit card churning tracker built with Next.js, TypeScript, and Material-UI.

## Development Workflow

### Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run code quality checks
./scripts/fix-code.sh
```

### Code Quality Automation

We maintain high code quality standards through automated tools and checks. Our `fix-code.sh` script handles:

1. **Code Formatting**

   - Prettier for consistent code style
   - Automatic import sorting
   - Configurable through `.prettierrc`

2. **Linting**

   - ESLint with TypeScript support
   - Automatic fixable error correction
   - Custom rules for Next.js and React

3. **Type Checking**

   - TypeScript strict mode enabled
   - Path aliases for clean imports
   - Comprehensive type definitions

4. **Test Coverage Requirements**
   - Business Logic: 90%+ coverage
   - API Routes: 85%+ coverage
   - UI Components: 80%+ coverage
   - Utility Functions: 75%+ coverage

### LLM-Assisted Development

This project is developed with the assistance of Language Learning Models (LLMs). To maintain code quality and consistency:

1. **Code Organization**

   - Clear directory structure
   - Consistent file naming
   - Modular component architecture

2. **Documentation**

   - Inline comments for complex logic
   - JSDoc for public APIs
   - Comprehensive test cover
   - Up-to-date README files

3. **Best Practices**

   - Component-driven development
   - Atomic design principles
   - Clean code principles
   - SOLID principles

4. **Quality Gates**
   - Pre-commit hooks for formatting
   - GitHub Actions for CI/CD
   - Automated test coverage checks
   - Pull request templates

### LLM-Friendly Error Output

The `fix-code.sh` script provides structured output optimized for LLM parsing:

1. **Section Markers**

   ```
   <<<<<<<<<< SECTION START: [SECTION_NAME]
   [section content]
   >>>>>>>>>> SECTION END: [SECTION_NAME]
   ```

2. **Error Format**

   ```
   <<<<<<<<<< ERROR START
   FILE: [file_path]
   TYPE: [error_type]
   LINE: [line_number]
   COLUMN: [column_number]
   MESSAGE: [error_message]
   CODE_CONTEXT:
   ```

   [code snippet]

   ```
   >>>>>>>>>>>> ERROR END
   ```

3. **Coverage Report**

   ```
   <<<<<<<<<< FILE: coverage/coverage-summary.json
   [coverage data in JSON format]
   >>>>>>>>>>>> END FILE
   ```

4. **Summary Format**
   ```
   <<<<<<<<<< SECTION START: SUMMARY
   EXECUTION_TIME: [duration] seconds
   TIMESTAMP: [ISO timestamp]
   >>>>>>>>>> SECTION END: SUMMARY
   ```

This structured output helps LLMs to:

- Precisely locate issues in the codebase
- Understand the context of each error
- Generate accurate fixes
- Track test coverage requirements
- Maintain code quality standards

### Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run format       # Format code with Prettier
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # Run TypeScript checks

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# All-in-one Quality Check
./scripts/fix-code.sh # Run all quality checks
```

### Directory Structure

```
src/
├── app/             # Next.js app router pages
├── components/      # Reusable UI components
├── lib/            # Core business logic
├── server/         # API routes and server code
├── theme/          # MUI theme customization
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

### Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run `./scripts/fix-code.sh` to ensure code quality
4. Create a pull request
5. Wait for review and CI checks

## License

MIT

# Environment Setup

## Environment Files
The project uses several environment files for different purposes:

1. `.env.local` - Local development environment variables
2. `.env.test` - Test environment variables
3. `cypress.env.json` - Cypress test environment variables

For security reasons, these files are not committed to the repository. Example files are provided:

- `.env.example` - Example local environment variables
- `.env.test.example` - Example test environment variables
- `cypress.env.example.json` - Example Cypress environment variables

To set up your environment:

1. Copy the example files:
   ```bash
   cp .env.example .env.local
   cp .env.test.example .env.test
   cp cypress.env.example.json cypress.env.json
   ```

2. Fill in the actual values in each file:
   - Firebase credentials
   - Database URLs
   - Test account credentials
   - Other API keys and secrets

## Security Notes
- Never commit sensitive data or credentials to the repository
- Keep all environment files (`.env.*`, `cypress.env.json`) in `.gitignore`
- Regularly rotate API keys and credentials
- Use separate credentials for development, testing, and production
- When setting up CI/CD, use secure environment variables

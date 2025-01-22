# AI-Optimized Project Documentation

## Quick Reference

- **Project Name**: Churnistic
- **Tech Stack**: Next.js 15
- **Testing Framework**: Jest (Unit), Cypress (E2E)
- **Security Standards**: OWASP, GDPR compliant
- **Documentation Version**: 1.0.0

## Project Structure

```
src/
├── app/           # Next.js application routes and components
├── lib/           # Core utilities and shared logic
└── mocks/         # Test mocks and fixtures
```

## Key Documentation Links

- [Architecture Documentation](./architecture_documentation.md)
- [Testing Strategy](./unit_testing_plan.md)
- [E2E Testing](./cypress_testing_strategy.md)
- [Code Review Guidelines](./code_review_opportunities_page.md)

## Development Guidelines

### Testing Requirements

- Unit Test Coverage: 90%
- Integration Test Coverage: 85%
- E2E Test Coverage: 80%
- All new features require tests
- Run tests: `npm test`

### Feature Development Workflow

1. Define requirements
2. Write tests
3. Implement feature
4. Code review
5. Deploy to staging
6. User testing
7. Production deployment

### AI Integration Guidelines

- Maximum context window: 8000 tokens
- Code review required for AI-generated code
- Changes must include explanations
- Use secure coding practices

### Security Protocols

- OWASP compliance required
- GDPR standards enforced
- Security review mandatory for new features
- Regular security audits

## Common Tasks for LLMs

### Code Generation

- Follow project structure
- Include necessary imports
- Add comprehensive tests
- Document new functions
- Follow TypeScript standards

### Code Review

- Check test coverage
- Verify security compliance
- Ensure documentation updates
- Validate TypeScript types
- Review error handling

### Documentation Updates

Required sections for new features:

1. Overview
2. Architecture impact
3. Security considerations
4. Deployment notes
5. Testing strategy
6. Usage examples

## Version Control

- Feature branches from main
- PR required for all changes
- CI/CD checks must pass
- Squash commits on merge

## Deployment

- Staging environment required
- Production approval needed
- Feature flags for gradual rollout
- Monitoring required

## Support and Resources

- Project analysis in [project_analysis_report.md](./project_analysis_report.md)
- Collaboration templates in [collaboration_template.md](./collaboration_template.md)
- Architecture details in [architecture_documentation.md](./architecture_documentation.md)

---

Last Updated: 2024-01-19

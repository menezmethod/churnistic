# Fix failing tests in useAuth and tRPC route

## Description

This PR fixes failing tests in the useAuth and tRPC route components, along with type errors in the admin users page and session hook.

### Changes made:
- Fixed useAuth test by properly mocking manageSessionCookie
- Fixed tRPC route test by correctly implementing error handler mock
- Fixed type errors in admin users page mutations
- Fixed session hook role type casting
- Cleaned up test implementations and improved error handling coverage

### Testing:
- All tests are now passing (164 tests across 32 test suites)
- Fixed TypeScript errors and linting issues
- Verified error handling in development and production environments

### Type of change:
- [x] Bug fix (non-breaking change which fixes an issue)
- [x] Test improvements
- [x] Code quality improvements

### Checklist:
- [x] My code follows the style guidelines of this project
- [x] I have performed a self-review of my own code
- [x] I have commented my code, particularly in hard-to-understand areas
- [x] I have made corresponding changes to the documentation
- [x] My changes generate no new warnings
- [x] I have added tests that prove my fix is effective
- [x] New and existing unit tests pass locally with my changes 
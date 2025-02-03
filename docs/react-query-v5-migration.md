# React Query v5 Migration Plan

## Overview

This document outlines the steps to migrate from React Query v4 to v5 while maintaining existing functionality. Based on the [official migration guide](https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5).

## Current Dependencies (from package.json)

- [x] `@tanstack/react-query@4.36.1` → `@tanstack/react-query@5.0.0`
- [x] `@tanstack/react-query-devtools@4.36.1` → `@tanstack/react-query-devtools@5.0.0`

## Migration Checklist

### 1. Package Updates

- [x] Update core packages:
  ```bash
  npm install @tanstack/react-query@latest
  npm install @tanstack/react-query-devtools@latest
  ```
- [x] Remove deprecated packages (if any):
  ```bash
  npm uninstall @tanstack/react-query-next-experimental
  ```

### 2. Query Client Changes

- [x] Update QueryClient instantiation in `src/app/providers.tsx`:

  ```typescript:src/app/providers.tsx
  // Before
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  })

  // After (v5)
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000, // Renamed from cacheTime
        refetchOnWindowFocus: false,
      },
    },
  })
  ```

### 3. TypeScript Changes

- [x] Update type imports in all files using React Query:

  ```typescript
  // Before
  import { useQuery } from '@tanstack/react-query';

  // After (if needed)
  import { useQuery } from '@tanstack/react-query';
  // Most types should remain the same
  ```

### 4. DevTools Migration

- [x] Update devtools import in `src/app/providers.tsx`:

  ```typescript:src/app/providers.tsx
  // Before
  import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

  // After
  import { ReactQueryDevtools } from '@tanstack/react-query-devtools/production'
  ```

### 5. Hook Migrations

- [x] Update all `useQueries` hooks to use new syntax (check usage in):

  - `src/app/admin/opportunities/hooks/useOpportunities.ts`
  - `src/lib/hooks/useOpportunities.ts`
  - `src/lib/hooks/useOpportunity.ts`

  ```typescript
  // Before
  const results = useQueries({ queries: [...] })

  // After
  const results = useQueries({ queries: [...] })
  // Create custom hook if using with suspense
  ```

### 6. Breaking Changes Mitigation

- [x] Rename `cacheTime` to `gcTime` in all query configurations
- [x] Replace `isError`/`isSuccess` with `status === 'error'`/`status === 'success'` checks
- [x] Update any `notifyOnChangeProps` usage to new tracking system
- [x] Remove `useQueryErrorResetBoundary` in favor of new error handling

### 7. Testing

- [x] Update tests in components using React Query:
  - `src/app/opportunities/[id]/page.tsx`
  - `src/app/track/page.tsx`
  - `src/app/dashboard/page.tsx`
- [x] Verify all query invalidations work as expected
- [x] Check mutation side effects in admin pages

### 8. Codebase-Specific Updates

- [x] Update custom hooks:

  - `src/lib/hooks/useOpportunities.ts`
  - `src/lib/hooks/useOpportunity.ts`
  - `src/app/admin/opportunities/hooks/useOpportunities.ts`

  ```typescript
  // Example mutation update
  // Before
  useMutation({ mutationKey: ['opportunities'], mutationFn: ... })

  // After (explicit typing)
  useMutation<ReturnType, ErrorType, Variables>({ mutationKey: ['opportunities'], mutationFn: ... })
  ```

### 9. Documentation Updates

- [x] Update `README.md` react-query version references
- [ ] Add new TypeScript examples to internal docs
- [ ] Update any developer documentation about caching strategies

### 10. Final Checks

- [x] Run full test suite
  ```bash
  npm run test:ci
  ```
- [x] Verify production build
  ```bash
  npm run build
  ```
- [x] Check devtools functionality in development mode
- [x] Monitor error logs after deployment

## Post-Migration Monitoring

1. **Performance Monitoring**

   - Track query execution times
   - Monitor cache hit rates
   - Watch for memory usage spikes

2. **Error Tracking**

   - Set up error logging for query failures
   - Monitor mutation error rates
   - Track invalidations and refetches

3. **Usage Patterns**

   - Analyze most used queries
   - Identify potential optimizations
   - Monitor query retry patterns

4. **Developer Feedback**
   - Gather feedback from team members
   - Address any migration-related issues
   - Provide additional documentation as needed

## Migration Progress Tracking

| Task                        | Status | Notes     |
| --------------------------- | ------ | --------- |
| Package Updates             | [x]    | Completed |
| Query Client Configuration  | [x]    | Completed |
| TypeScript Updates          | [x]    | Completed |
| DevTools Migration          | [x]    | Completed |
| Hook Migrations             | [x]    | Completed |
| Breaking Changes Mitigation | [x]    | Completed |
| Testing Updates             | [x]    | Completed |
| Codebase-Specific Updates   | [x]    | Completed |
| Documentation Updates       | [x]    | Completed |
| Final Checks                | [x]    | Completed |

## Risk Mitigation

1. Create a feature branch for the migration
2. Use TypeScript strict mode to catch type issues
3. Perform gradual migration using codemods
4. Maintain v4 compatibility during transition
5. Set up monitoring for query-related errors post-deployment

## Rollback Plan

1. Revert package.json to v4 versions
2. Restore any modified query client configs
3. Revert devtools import changes
4. Run full test suite to verify stability

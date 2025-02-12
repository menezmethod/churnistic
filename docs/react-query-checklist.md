# React Query Implementation Checklist

## Query Key Management

- [x] Centralized query keys in `src/lib/query/keys.ts`
- [x] Type-safe query keys with `as const`
- [x] Organized by feature and operation type
- [x] Consistent naming convention

## Field Edit Operations

- [x] Optimistic updates with proper rollback
- [x] Type-safe mutation functions
- [x] Proper error handling and recovery
- [x] Loading states during edits
- [x] Toast notifications for success/error
- [x] Nested field updates using lodash.set

## Cache Management

- [x] Proper staleTime configuration (5 minutes)
- [x] Proper gcTime configuration (10 minutes)
- [x] Cache invalidation strategy
- [x] Optimistic updates with rollback
- [x] Query cancellation before mutations

## Error Handling

- [x] Retry configuration (max 2 retries)
- [x] No retries on 404s
- [x] Toast notifications
- [x] Error recovery with cache rollback
- [x] Type-safe error handling

## Server-Side Operations

- [x] Proper HTTP methods (PUT for updates)
- [x] Content-Type headers
- [x] Error response handling
- [x] Metadata updates
- [x] Validation

## Performance

- [x] Memoized callbacks
- [x] Optimized state updates
- [x] Proper loading states
- [x] Query deduplication
- [x] Background refetching

## Type Safety

- [x] Type-safe mutations
- [x] Type-safe query keys
- [x] Type-safe responses
- [x] Type-safe error handling
- [x] Type-safe state management

## User Experience

- [x] Loading indicators
- [x] Error messages
- [x] Success notifications
- [x] Optimistic updates
- [x] Proper validation feedback

## Testing (TODO)

- [ ] Unit tests for hooks
- [ ] Integration tests for mutations
- [ ] Mock server responses
- [ ] Error scenarios
- [ ] Loading states

## Documentation (TODO)

- [ ] API documentation
- [ ] Hook usage examples
- [ ] Error handling guide
- [ ] Best practices
- [ ] Migration guide

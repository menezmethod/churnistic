# React Query v5 Best Practices for Inline Editing

## Overview

This document outlines the best practices for implementing inline editing with React Query v5, focusing on maintaining data consistency and optimizing user experience.

## Core Concepts

### Query vs Mutation

- **Queries**: Used for fetching data that is read-only or rarely changes
- **Mutations**: Used for creating, updating, or deleting data

## Proper Setup

### Provider Configuration

```tsx
// Recommended configuration for React Query v5
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)
      refetchOnWindowFocus: false,
      retry: 1,
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
      retry: 1,
    },
  },
});
```

### Custom Hooks for Reusability

```tsx
// Example hook for updating a resource
export const useUpdateResource = <T,>(resourceId: string, resourceType: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<T>) => {
      const response = await fetch(`/api/${resourceType}/${resourceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update resource');
      }

      return response.json();
    },

    // Optimistic updates
    onMutate: async (newData) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: [resourceType, resourceId] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<T>([resourceType, resourceId]);

      // Optimistically update the cache
      queryClient.setQueryData<T>([resourceType, resourceId], (old) => {
        return { ...old, ...newData } as T;
      });

      // Return context for potential rollback
      return { previousData };
    },

    // On error, roll back to the previous value
    onError: (err, newData, context) => {
      if (context?.previousData) {
        queryClient.setQueryData<T>([resourceType, resourceId], context.previousData);
      }
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [resourceType, resourceId] });
    },
  });
};
```

## Best Practices for Inline Editing

### 1. Maintain Local and Server State Separately

```tsx
const InlineEditField = ({ initialValue, onSave }) => {
  // Local state for the form
  const [value, setValue] = useState(initialValue);
  // Track editing state
  const [isEditing, setIsEditing] = useState(false);

  // Reset local state when initialValue changes
  useEffect(() => {
    if (!isEditing) {
      setValue(initialValue);
    }
  }, [initialValue, isEditing]);

  const handleSubmit = () => {
    onSave(value);
    setIsEditing(false);
  };

  // ...rest of component
};
```

### 2. Proper Optimistic Updates with Partial Data

```tsx
// For nested objects, ensure you're updating correctly
const updateField = (fieldPath: string, value: any) => {
  const fieldParts = fieldPath.split('.');
  const updateData = {};

  // Build nested structure
  let currentLevel = updateData;
  for (let i = 0; i < fieldParts.length - 1; i++) {
    currentLevel[fieldParts[i]] = {};
    currentLevel = currentLevel[fieldParts[i]];
  }

  // Set the actual value
  currentLevel[fieldParts[fieldParts.length - 1]] = value;

  return updateMutation.mutate(updateData);
};
```

### 3. Handle Different Field Types Correctly

```tsx
// For select fields
const handleSelectChange = (e) => {
  // Some backends expect different formats for selects
  // Ensure you're sending the right format
  const value = e.target.value;
  updateMutation.mutate({
    fieldName: typeof value === 'string' ? value : value.toString(),
  });
};

// For multiline text
const handleMultilineChange = (e) => {
  // Preserve line breaks
  const value = e.target.value;
  updateMutation.mutate({ fieldName: value });
};
```

### 4. Track Mutation Status for UI Feedback

```tsx
const EditableField = ({ fieldName, initialValue, onSave }) => {
  const mutation = useMutation({
    mutationFn: (value) => onSave(fieldName, value),
  });

  return (
    <div>
      {mutation.isPending && <LoadingSpinner />}
      {mutation.isError && <ErrorMessage error={mutation.error} />}
      {/* Field UI */}
    </div>
  );
};
```

### 5. Be Cautious with Deeply Nested Data

- When updating deeply nested data, prefer sending the full path to the backend
- Consider normalizing complex data structures for easier updates
- Use libraries like Immer for immutable updates to complex objects

### 6. Handle Race Conditions

```tsx
// Add a request identifier to track the most recent request
const updateField = async (fieldName, value) => {
  const requestId = Date.now();
  setLatestRequestId(requestId);

  try {
    const result = await updateMutation.mutateAsync({ [fieldName]: value });
    // Only update if this is still the latest request
    if (requestId === latestRequestId) {
      // Handle success
    }
  } catch (error) {
    // Handle error
  }
};
```

## Debugging React Query

### React Query DevTools

Always enable React Query DevTools in development:

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Debugging Mutations

Add mutation observers for debugging:

```tsx
const mutation = useMutation({
  mutationFn: updateUser,
  onMutate: (variables) => {
    console.log('Mutation variables:', variables);
  },
  onSuccess: (data) => {
    console.log('Mutation succeeded:', data);
  },
  onError: (error) => {
    console.error('Mutation failed:', error);
  },
});
```

## Performance Optimization

### Selective Updates

Only update the specific fields that changed:

```tsx
// Bad - sends the entire object even for a small change
updateMutation.mutate(entireLargeObject);

// Good - only sends what changed
updateMutation.mutate({ specificField: newValue });
```

### Batching Related Updates

For multiple field updates, consider batching them:

```tsx
// Custom hook for batched updates
const useBatchedUpdates = (resourceId) => {
  const [batch, setBatch] = useState({});
  const updateMutation = useUpdateResource(resourceId);

  const addToBatch = (field, value) => {
    setBatch((prev) => ({ ...prev, [field]: value }));
  };

  const commitBatch = () => {
    if (Object.keys(batch).length > 0) {
      updateMutation.mutate(batch);
      setBatch({});
    }
  };

  return { addToBatch, commitBatch, batch };
};
```

## Common Pitfalls to Avoid

1. **Forgetting to handle load states**: Always show loading indicators during mutations
2. **Not providing fallbacks**: Always handle errors and fallback UI
3. **Improper cache invalidation**: Only invalidate what's necessary
4. **Too aggressive refetching**: Configure appropriate staleTime and gcTime
5. **Not handling optimistic rollbacks**: Always provide a way to revert optimistic updates if the mutation fails

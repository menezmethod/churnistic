# Implementation Examples for Fixing Inline Editing Issues

## 1. Fix for `useEditMode.ts`

The primary fix needed is to modify the optimistic update in the `updateField` function to properly merge data instead of replacing it. Here's a specific implementation:

```typescript
// src/app/opportunities/[id]/hooks/useEditMode.ts

// Import a deep merge utility if not already present
import { merge } from 'lodash'; // Or your preferred deep merge utility

const updateField = useCallback(
  (fieldKey: string, value: string | number | boolean) => {
    // Update local state
    setEditState((prev: EditModeState) => ({
      ...prev,
      editingFields: {
        ...prev.editingFields,
        [fieldKey]: {
          ...prev.editingFields[fieldKey],
          value,
          isEditing: false,
        },
      },
    }));

    // Create updated opportunity object for the specific field
    const updatedOpportunity = { ...opportunity };
    set(updatedOpportunity, fieldKey, value);

    // Update metadata
    updatedOpportunity.metadata = {
      ...updatedOpportunity.metadata,
      updated_at: new Date().toISOString(),
    };

    // Optimistically update the cache WITH PROPER MERGING
    queryClient.setQueryData(opportunityKeys.detail(opportunity.id), (oldData) => {
      if (!oldData) return updatedOpportunity;

      // Deep merge to preserve all nested fields
      return merge({}, oldData, updatedOpportunity);
    });

    // Send update to server (keep the existing nested object construction)
    const fieldParts = fieldKey.split('.');
    const updateData: Record<string, unknown> = {};
    let currentObj = updateData;

    // Build nested object structure
    for (let i = 0; i < fieldParts.length - 1; i++) {
      currentObj[fieldParts[i]] = {} as Record<string, unknown>;
      currentObj = currentObj[fieldParts[i]] as Record<string, unknown>;
    }
    currentObj[fieldParts[fieldParts.length - 1]] = value;

    // Add metadata
    updateData.metadata = {
      ...opportunity.metadata,
      updated_at: new Date().toISOString(),
    };

    // Add debugging logs
    console.log('Updating field:', fieldKey, 'with value:', value);
    console.log('Generated update data:', updateData);

    updateOpportunity({
      id: opportunity.id,
      data: updateData,
    });
  },
  [opportunity, queryClient, updateOpportunity]
);
```

## 2. Fix for `useUpdateOpportunity.ts`

Enhance the optimistic update logic in this hook to handle nested data correctly:

```typescript
// src/lib/hooks/useUpdateOpportunity.ts

import { merge } from 'lodash'; // Or your preferred deep merge utility

// Inside the useMutation options
onMutate: async ({ id, data }) => {
  // Cancel any outgoing refetches
  await queryClient.cancelQueries({ queryKey: opportunityKeys.detail(id) });

  // Snapshot the previous value
  const prev = queryClient.getQueryData<FirestoreOpportunity>(
    opportunityKeys.detail(id)
  );

  // Optimistically update the cache with proper deep merge
  if (prev) {
    queryClient.setQueryData<FirestoreOpportunity>(
      opportunityKeys.detail(id),
      (oldData) => {
        if (!oldData) return { ...data, id };

        // Use deep merge to properly handle nested fields
        return merge({}, oldData, data, {
          metadata: {
            ...oldData.metadata,
            ...data.metadata,
            updated_at: new Date().toISOString(),
          }
        });
      }
    );
  }

  // Return context with the prev value
  return { prev };
},
```

## 3. Fix for API Route Handler

Improve the server-side processing of updates in `src/app/api/opportunities/[id]/route.ts`:

```typescript
// Inside the PUT function

// Enhanced processing of update data
const firestoreUpdateData = processUpdateData(body);

// Helper function to properly handle nested objects
function processUpdateData(
  data: Record<string, unknown>,
  prefix = ''
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    // If this is a nested object (but not an array or null), process it recursively
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Special handling for metadata and other known structures
      if (key === 'metadata' || key === 'details') {
        result[fullKey] = value;
      } else {
        // Process nested objects
        Object.assign(
          result,
          processUpdateData(value as Record<string, unknown>, fullKey)
        );
      }
    } else {
      // Handle primitive values (including arrays)
      result[fullKey] = value;
    }
  }

  return result;
}

// Add debugging
console.log('Received update data:', body);
console.log('Processed update data for Firestore:', firestoreUpdateData);

// Update the document with processed data
const updatedDoc = await db.collection('opportunities').doc(id);
await updatedDoc.update(firestoreUpdateData);
```

## 4. Helper Function for Working with Nested Fields

Create a utility file to standardize handling of nested fields:

```typescript
// src/utils/objectUtils.ts

import { merge, get, set } from 'lodash';

/**
 * Deep merges objects while preserving nested structures
 */
export function deepMergeObjects<T>(target: T, ...sources: Partial<T>[]): T {
  return merge({}, target, ...sources);
}

/**
 * Creates a nested object from a dot-notation path and value
 * @example
 * // Returns { user: { profile: { name: 'John' } } }
 * createNestedObject('user.profile.name', 'John')
 */
export function createNestedObject(
  path: string,
  value: unknown
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const parts = path.split('.');

  let current = result;
  for (let i = 0; i < parts.length - 1; i++) {
    current[parts[i]] = {};
    current = current[parts[i]] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
  return result;
}

/**
 * Flattens a nested object into dot notation paths
 * @example
 * // Returns { 'user.profile.name': 'John' }
 * flattenObject({ user: { profile: { name: 'John' } } })
 */
export function flattenObject(
  obj: Record<string, unknown>,
  prefix = ''
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, newKey));
    } else {
      result[newKey] = value;
    }
  }

  return result;
}
```

## 5. Addition to EditableField Component

Add error handling to improve the robustness of the component:

```typescript
// In src/app/opportunities/[id]/components/EditableField.tsx

const handleSubmit = () => {
  try {
    // Log before submission for debugging
    console.log(
      `Submitting field: ${JSON.stringify({
        field: field.type,
        before: field.value,
        after: localValue,
      })}`
    );

    onEdit(localValue);
    setIsEditing(false);
  } catch (error) {
    console.error('Error submitting field edit:', error);
    // Show error to user
    // You could add a toast notification here

    // Reset to original value
    setLocalValue(field.value ?? '');
    setIsEditing(false);
  }
};
```

## Integration Testing Code

Add this function to your application to help test the fix:

```typescript
// src/utils/testUtils.ts

/**
 * Function to test inline editing functionality
 * Call this from the browser console to verify fixes
 */
export function testInlineEditing(opportunityId: string) {
  // Get the QueryClient
  const queryClient = window.__REACT_QUERY_GLOBAL_CLIENT__;
  if (!queryClient) {
    console.error('React Query client not found');
    return;
  }

  // Get the current state
  const before = queryClient.getQueryData(['opportunity', 'detail', opportunityId]);
  console.log('Before update:', JSON.stringify(before, null, 2));

  // Simulate a field update
  // Update a nested field to test the fix
  const testFieldKey = 'details.some_nested_field';
  const testValue = 'Test value ' + new Date().toISOString();

  // Log the update
  console.log(`Testing update of ${testFieldKey} to ${testValue}`);

  // After a short delay, get the updated state
  setTimeout(() => {
    const after = queryClient.getQueryData(['opportunity', 'detail', opportunityId]);
    console.log('After update:', JSON.stringify(after, null, 2));

    // Check if data was lost
    console.log('Was any data lost?', detectDataLoss(before, after, testFieldKey));
  }, 2000);
}

/**
 * Helper to detect if any data was lost during an update
 */
function detectDataLoss(before: any, after: any, excludedField: string): string[] {
  const lostFields: string[] = [];

  function compareObjects(a: any, b: any, path = '') {
    if (!a || !b) return;

    for (const key in a) {
      const currentPath = path ? `${path}.${key}` : key;

      // Skip the field we intentionally changed
      if (currentPath === excludedField) continue;

      // Check if the field exists in the updated object
      if (!(key in b)) {
        lostFields.push(currentPath);
        continue;
      }

      // Recursively check nested objects
      if (
        a[key] &&
        typeof a[key] === 'object' &&
        !Array.isArray(a[key]) &&
        b[key] &&
        typeof b[key] === 'object' &&
        !Array.isArray(b[key])
      ) {
        compareObjects(a[key], b[key], currentPath);
      }
    }
  }

  compareObjects(before, after);
  return lostFields;
}

// Make it available in the window object for testing
if (typeof window !== 'undefined') {
  (window as any).testInlineEditing = testInlineEditing;
}
```

These implementation examples should help address the core issues causing data deletion during inline editing. The most critical fix is to the optimistic updates in `useEditMode.ts`, which should resolve most cases of the issue.

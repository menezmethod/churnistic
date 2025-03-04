# Root Cause Analysis & Fix for Inline Editing Deletion Issue

## Identified Root Causes

After reviewing the code, I've identified several potential causes for the issue where sections are being deleted upon submitting inline edits:

### 1. Improper Optimistic Updates in `useEditMode.ts`

The most likely issue is in the optimistic update in `useEditMode.ts`. The current implementation:

```typescript
// Create updated opportunity object
const updatedOpportunity = { ...opportunity };
set(updatedOpportunity, fieldKey, value);

// Optimistically update the cache
queryClient.setQueryData(
  opportunityKeys.detail(opportunity.id),
  updatedOpportunity
);
```

This directly replaces the entire cached object with `updatedOpportunity`, which might be missing some nested fields that weren't included in the spread operation.

### 2. Incomplete Data in API PUT Request

When building the update object for the server, the code constructs a partial object instead of sending the full object structure:

```typescript
// Send update to server
const fieldParts = fieldKey.split('.');
const updateData: Record<string, unknown> = {};
let currentObj = updateData;

// Build nested object structure
for (let i = 0; i < fieldParts.length - 1; i++) {
  currentObj[fieldParts[i]] = {} as Record<string, unknown>;
  currentObj = currentObj[fieldParts[i]] as Record<string, unknown>;
}
currentObj[fieldParts[fieldParts.length - 1]] = value;
```

This correctly builds a nested object, but if the server expects a full object structure for certain operations, it could lead to data loss.

### 3. Server-Side Update Replacing Instead of Merging

In the API route handler, the update operation is using Firestore's `update()` method:

```typescript
const updatedDoc = await db.collection('opportunities').doc(id);
await updatedDoc.update(firestoreUpdateData);
```

This should properly merge changes, but if `firestoreUpdateData` has nested objects that are constructed incorrectly, it could replace entire sections.

## Recommended Fixes

### 1. Fix Optimistic Updates in `useEditMode.ts`

```typescript
// Modify the optimistic update to merge with existing data:
queryClient.setQueryData(
  opportunityKeys.detail(opportunity.id),
  (oldData) => {
    if (!oldData) return updatedOpportunity;
    // Deep merge to preserve all nested fields
    return {
      ...oldData,
      ...updatedOpportunity,
      // Handle nested fields if needed
      // For nested objects that could be overwritten, use more specific merging
    };
  }
);
```

### 2. Fix the useUpdateOpportunity Hook's Optimistic Update

The current implementation in `useUpdateOpportunity.ts` uses a shallow merge, which could cause issues with nested data:

```typescript
queryClient.setQueryData<FirestoreOpportunity>(opportunityKeys.detail(id), {
  ...prev,
  ...data,
  metadata: {
    ...prev.metadata,
    ...data.metadata,
    updated_at: new Date().toISOString(),
  },
});
```

For complex nested structures, this should be modified to use a deep merge:

```typescript
import deepmerge from 'deepmerge';

queryClient.setQueryData<FirestoreOpportunity>(
  opportunityKeys.detail(id),
  (oldData) => {
    if (!oldData) return { ...data, id };
    return deepmerge(oldData, data, {
      // Custom merge options if needed
      arrayMerge: (destinationArray, sourceArray) => sourceArray,
    });
  }
);
```

### 3. Ensure API Route Properly Handles Nested Updates

Modify the opportunity update handler in `src/app/api/opportunities/[id]/route.ts`:

```typescript
// Improve the handling of nested fields
const firestoreUpdateData = Object.entries(body).reduce(
  (acc, [key, value]) => {
    // Handle nested paths properly
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // For nested objects, flatten them into dot notation for Firestore
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        acc[`${key}.${nestedKey}`] = nestedValue;
      });
    } else {
      acc[key] = value;
    }
    return acc;
  },
  {} as Record<string, unknown>
);
```

### 4. Debugging Logs for Data Flow Tracking

Add strategic console logs to track the data flow:

```typescript
// In useEditMode.ts - updateField function
console.log('Before update - Current opportunity:', opportunity);
console.log('Updating field:', fieldKey, 'with value:', value);
console.log('Update data being sent to server:', updateData);

// In API route
console.log('Received update data:', body);
console.log('Processed Firestore update data:', firestoreUpdateData);
```

## Implementation Plan

1. **First Fix**: Update the optimistic update logic in `useEditMode.ts` to properly merge data instead of replacing it.

2. **Second Fix**: Add a deep merge utility if not already present, and ensure all optimistic updates use it.

3. **Third Fix**: Update the API route handler to properly process nested updates and ensure they merge correctly with existing data.

4. **Testing**: After implementing these changes, thoroughly test with different field types, especially nested fields, to ensure the updates work correctly.

## Explanation of the Problem

The root issue appears to be related to how data is managed during updates, particularly with nested fields. The combination of:

1. An optimistic update strategy that replaces rather than merges
2. A server update that might not correctly handle complex nested structures
3. Potential inconsistencies in how different field types are processed

By implementing proper deep merging for optimistic updates and ensuring the server-side logic correctly handles nested structures, the deletion issue should be resolved. 
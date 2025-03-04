# Debugging Guide: Inline Editing Section Deletion Issue

## Issue Description
When submitting an inline edit, sections of content are being deleted unexpectedly. This document provides a step-by-step approach to identify and fix the issue.

## Potential Root Causes

1. **Partial Update Structure**: The update being sent to the server might not be maintaining the proper object structure
2. **Optimistic UI Updates**: The React Query optimistic update might be improperly structured
3. **API Response Handling**: The response from the API might be replacing entire objects instead of merging changes
4. **Component State Management**: Local component state might be conflicting with the global state

## Step 1: Identify the Exact Pattern

First, determine the specific pattern of the deletion:

- [ ] Which specific field types have this issue? (text, select, multiline, etc.)
- [ ] Does it happen only with nested fields or all fields?
- [ ] Is it consistent or intermittent?
- [ ] Does it happen immediately or after the server responds?

## Step 2: Inspect Network Requests

### Request Payload Analysis
1. Open browser DevTools and go to the Network tab
2. Filter for API requests (filter: "api")
3. Perform an inline edit that reproduces the issue
4. Examine the request payload:
   - Is the structure of the data correct?
   - Are all expected fields included?
   - Are nested objects structured correctly?

### Response Analysis
1. Check the response from the server
2. Verify if the response includes the full object or just the updated fields
3. Look for any unexpected `null` values or missing fields

## Step 3: Debug with React Query DevTools

1. Open React Query DevTools (enable in development if not already)
2. Observe the query cache before and after the mutation
3. Check if the optimistic update is correctly applied
4. Verify if the cache is being properly updated after the server response
5. Look for any cache invalidation issues

## Step 4: Add Strategic Console Logging

Add logging to key points in the data flow:

```jsx
// In useEditMode.ts
const updateField = useCallback(
  (fieldKey: string, value: string | number | boolean) => {
    console.log('Before update - Opportunity:', opportunity);
    console.log('Updating field:', fieldKey, 'with value:', value);
    
    // Create updated opportunity object
    const updatedOpportunity = { ...opportunity };
    set(updatedOpportunity, fieldKey, value);
    console.log('After update - Updated object:', updatedOpportunity);
    
    // Rest of the function...
  },
  [opportunity, queryClient, updateOpportunity]
);
```

Also add logging to the API route handler to see what's being received:

```jsx
// In the API route handler
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    let body;
    try {
      body = await request.json();
      console.log('API received update:', body);
      
      // Rest of the function...
    } catch (error) {
      console.error('Error parsing request body:', error);
      // Error handling...
    }
  } catch (error) {
    console.error('Error in route handler:', error);
    // Error handling...
  }
}
```

## Step 5: Common Issues to Check

### Issue 1: Improper Nested Object Handling
When updating nested fields like `details.monthly_fees.amount`, ensure the structure is maintained:

```jsx
// Correct approach for nested updates
const fieldParts = fieldKey.split('.');
const updateData: Record<string, unknown> = {};
let currentObj = updateData;

// Build nested object structure
for (let i = 0; i < fieldParts.length - 1; i++) {
  currentObj[fieldParts[i]] = {};
  currentObj = currentObj[fieldParts[i]] as Record<string, unknown>;
}
currentObj[fieldParts[fieldParts.length - 1]] = value;

// Then send updateData to the server
```

### Issue 2: Improper Optimistic Updates
Ensure optimistic updates properly merge with existing data rather than replacing it:

```jsx
// Correct optimistic update
queryClient.setQueryData(
  opportunityKeys.detail(opportunity.id),
  (oldData) => {
    if (!oldData) return updatedOpportunity;
    
    // Deep merge oldData with updatedOpportunity
    return deepMerge(oldData, updatedOpportunity);
  }
);
```

### Issue 3: API Response Replacing Instead of Merging
If the API response is replacing entire objects, modify the API route handler:

```jsx
// In the API route handler
const updatedDoc = await db.collection('opportunities').doc(id);
await updatedDoc.update(firestoreUpdateData); // Use update not set

// Get and return only what was updated
return NextResponse.json({
  ...firestoreUpdateData,
  // Include any additional metadata
});
```

## Step 6: Specific Field Type Issues

### Text Fields
- Ensure empty string values are properly handled (not converted to null)
- Check how trimming is applied

### Select Fields
- Verify the selected value matches one of the available options
- Check for any type conversion issues (string vs. number)

### Multiline Text Fields
- Verify line breaks are being preserved
- Check for any HTML sanitization issues

## Step 7: Testing the Fix

Once the issue is identified and fixed, test thoroughly:

1. Test with a variety of field types
2. Test with nested and non-nested fields
3. Test with empty values, long values, special characters
4. Test rapid consecutive edits
5. Test with network throttling to simulate slow connections

## Conclusion

The most likely cause of sections being deleted upon submission is related to how nested object updates are handled. Pay special attention to:

1. How fields paths are parsed and reconstructed
2. How optimistic updates are structured
3. How the API processes partial updates
4. How the updated data is merged back into the UI

By following this debugging guide, you should be able to identify and fix the specific cause of the section deletion issue. 
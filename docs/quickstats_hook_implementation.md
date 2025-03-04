# Quick Stats Hook Implementation

This document explains the implementation of the dedicated `useQuickStats` hook that was created to properly handle updates to the Quick Stats section in the opportunity details page.

## Background

The Quick Stats section was experiencing issues where updating one field would cause other sections to disappear due to problems with how optimistic updates were being handled. This was part of a larger issue with inline editing throughout the application.

## Solution: Dedicated useQuickStats Hook

We created a dedicated hook to manage updates to the Quick Stats fields, which include:

- Value (number)
- Type (select)
- Bank (text)

The hook addresses several key problems:

1. **Precise Field Updates**: Each field is updated individually with a dedicated PUT request
2. **Optimistic Updates**: Updates are applied optimistically to the UI first, then confirmed with the server
3. **Deep Cloning**: Proper deep cloning of objects prevents reference issues
4. **Error Handling**: Comprehensive error handling with automatic rollback on failure
5. **Loading States**: Clear loading indicators for specific fields being updated

## Implementation Details

### 1. The `useQuickStats` Hook

The hook provides specialized functions for updating each field type, along with a generic update function:

```typescript
// Core functions
updateValue(newValue: number): Promise<void>
updateType(newType: string): Promise<void>
updateBank(newBank: string): Promise<void>

// Generic function that handles type conversion
updateQuickStatsField(field: QuickStatsField, value: string | number): Promise<void>

// State for tracking loading and active updates
state: {
  isLoading: boolean;
  updatingField: QuickStatsField | null;
}
```

The hook is used like this:

```typescript
const { updateQuickStatsField, state } = useQuickStats(opportunity);

// Update a specific field
updateQuickStatsField('value', 5000);

// Check if a field is updating
const isValueLoading = state.updatingField === 'value' && state.isLoading;
```

### 2. Enhanced `EditableWrapper` Component

We updated the `EditableWrapper` component to work seamlessly with the new hook by:

- Adding proper loading state support
- Enhancing the select options to support label/value pairs
- Providing direct value update callbacks (rather than field/value pairs)
- Adding formatters for displaying values
- Supporting icons and labels directly in the component

### 3. Updated `mergeUtils` Library

We created utility functions that support proper object manipulation:

- `mergeDeep`: A robust deep merge utility that correctly handles nested objects
- `updateField`: Updates a specific field in an object using a path string
- `createNestedObject`: Creates an object with a nested structure based on a path

## Usage in the Quick Actions Section

The Quick Stats fields in the `QuickActionsSection` component now use the new hook:

```typescript
const { updateQuickStatsField, state: quickStatsState } = useQuickStats(opportunity);

// In the render method:
<EditableWrapper
  canEdit={canEdit}
  isGlobalEditMode={isGlobalEditMode}
  onUpdate={(value) => updateQuickStatsField('value', value)}
  isLoading={quickStatsState.updatingField === 'value' && quickStatsState.isLoading}
  icon={<MonetizationOn />}
  label="Value"
  value={opportunity.value || 0}
  formatter={(val) => `$${Number(val).toLocaleString()}`}
  inputType="number"
/>
```

## Key Benefits

1. **Maintainability**: Each field has a dedicated update function with clean logic
2. **Reliability**: Updates to one field cannot affect other fields
3. **User Experience**: Loading indicators show exactly which field is being updated
4. **Error Handling**: Each field has its own error handling, preventing cascading failures
5. **Type Safety**: Strong typing for field names and values

## Applying This Pattern Elsewhere

This pattern of specialized hooks for specific component sections can be applied to other parts of the application where field updates are causing issues:

1. Identify a group of related fields that are updated together
2. Create a dedicated hook for those fields
3. Implement specialized update functions with proper optimistic updates
4. Use the enhanced `EditableWrapper` for consistent UX

By following this pattern, we can ensure that inline editing works reliably and predictably throughout the application.

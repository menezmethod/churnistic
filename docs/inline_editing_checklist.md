# Inline Editing Checklist

## Overview
This document provides a comprehensive checklist for debugging and fixing the inline editing functionality, with a specific focus on resolving the issue where sections are being deleted upon submission. The checklist ensures proper implementation of API routes for server-side updates and leverages the latest React Query v5 best practices on the client side.

## Problem Statement
When submitting an inline edit, a section is being deleted. This suggests potential issues with:
1. How data is being transformed before submission
2. How optimistic updates are being handled
3. How the server-side API is processing the update
4. How React Query mutation responses are being handled

## Component-Level Checklist

### EditableField Component
- [ ] Verify the `handleSubmit` function correctly passes the `localValue` to the parent via `onEdit`
- [ ] Confirm that `setIsEditing(false)` is called at the correct time (after successful submission)
- [ ] Ensure the `useEffect` dependency array is properly tracking field.value changes
- [ ] Check rendering conditions to ensure no sections are unexpectedly cleared/removed
- [ ] Verify the component tracks both remote and local state correctly
- [ ] Ensure form validation is applied before submission

### useEditMode Hook
- [ ] Verify `updateField` function builds the nested object structure correctly
- [ ] Check that `queryClient.setQueryData` has proper structure for optimistic updates
- [ ] Confirm the mutation function receives the correct data format
- [ ] Validate that all fields (single text, selects, multiline, etc.) are handled correctly
- [ ] Ensure the field isn't being cleared prematurely before server responds

## API Route Implementation Checklist

### Server-Side Updates
- [ ] Verify route handler properly processes nested object updates
- [ ] Check for potential data transformation issues in the API route
- [ ] Ensure updates only affect specified fields and not entire sections
- [ ] Confirm proper error handling in update API route
- [ ] Verify that metadata updates don't interfere with actual field updates
- [ ] Check if any middleware is modifying the request/response

## React Query v5 Implementation

### Mutation Configuration
- [ ] Implement proper `useMutation` error handling with fallbacks
- [ ] Ensure `onMutate` creates accurate optimistic updates
- [ ] Verify `onError` properly rolls back changes if necessary
- [ ] Use proper cache invalidation strategy
- [ ] Set appropriate retry and cache configuration
- [ ] Return proper data structure from successful mutations

### Best Practices
- [ ] Use query keys consistently throughout the application
- [ ] Implement proper data transformation in hooks, not components
- [ ] Utilize React Query's `select` option for data transformation where needed
- [ ] Implement proper loading/error states during mutations
- [ ] Check network request payloads for proper data format
- [ ] Consider adding debugging with React Query DevTools

## Field Type-Specific Checks

### Text Fields
- [ ] Verify empty string vs null handling
- [ ] Ensure proper focus/blur behavior
- [ ] Check for proper change event handling

### Select Fields
- [ ] Confirm option values match expected backend format
- [ ] Verify selected value is properly serialized for submission
- [ ] Check for potential issues with string vs number conversions

### Multiline Text
- [ ] Ensure line breaks are preserved properly
- [ ] Verify autosizing behavior works as expected
- [ ] Check for potential HTML escaping issues

## Styling Checks
- [ ] Confirm that no styling is lost during inline editing
- [ ] Verify that animation transitions work smoothly
- [ ] Ensure proper spacing is maintained during and after editing
- [ ] Check responsive behavior on different screen sizes
- [ ] Verify focus/hover states have the correct styling

## Testing Steps
1. Edit a text field, submit, and verify the content remains correct
2. Edit a select field, submit, and verify the selection remains correct
3. Edit a multiline field with complex content, submit, and verify all content remains
4. Test with very long content to ensure no truncation issues
5. Test error conditions to ensure data isn't lost
6. Test rapid edits to ensure no race conditions

## Debugging Recommendations
1. Add console logs in the mutation flow to track exact data being sent/received
2. Check browser network tab to see the exact payload being sent
3. Verify server logs for any errors or transformations happening
4. Add React Query DevTools to visualize cache state during mutations
5. Test a simplified case to isolate if the issue is in UI or API side 
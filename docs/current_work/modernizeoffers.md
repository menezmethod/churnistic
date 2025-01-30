# Modern Offer Details Implementation Plan

## Overview

This document outlines the plan to modernize the offer details editing experience, focusing on inline editing, granular updates, and type-specific configurations. The goal is to create a user-friendly, robust, and efficient editing interface with a "Fortune 10" look and feel.

**Implementation Checklist:**

- [ ] **Phase 1: Core Inline Editing Functionality**

  - [ ] **1. Inline Edit Component (`src/components/InlineEdit.tsx`)**
    - [ ] Create a reusable component that wraps editable content.
    - [ ] Combine Radix UI's `Editable` primitive with MUI styling.
    - [ ] Implement hover states to indicate editable fields.
    - [ ] Display edit icons to trigger edit mode.
    - [ ] Manage focus and keyboard interactions for accessibility.
    - [ ] Accept a `value` prop for initial content and an `onSave` prop for updates.
    - [ ] Example Usage:
      ```tsx
      <InlineEdit value={opportunity.name} onSave={(value) => updateField('name', value)}>
        <Typography>{opportunity.name}</Typography>
      </InlineEdit>
      ```
  - [ ] **2. Field-Level Mutations (`src/app/opportunities/[id]/useOpportunityDetails.ts`)**
    - [ ] Implement `updateField(id: string, field: string, value: any)` function using `react-query`'s `useMutation`.
    - [ ] Include optimistic update logic for immediate user feedback.
    - [ ] Handle API calls to persist changes to the backend.
    - [ ] Implementation:
      ```typescript
      const updateField = (id: string, field: string, value: any) => {
        return queryClient.mutate({
          mutationFn: (vars) => api.update(vars), // api.update should handle the actual API call
          onMutate: async (vars) => {
            // Optimistic update logic: Update the local cache immediately
            // Example: queryClient.setQueryData(['opportunity', id], (oldData) => ({...oldData, [field]: value}))
          },
          onSuccess: () => {
            // Invalidate relevant queries to refetch data
            queryClient.invalidateQueries(['opportunity', id]);
          },
          onError: (error) => {
            // Handle errors and potentially revert optimistic updates
            console.error('Error updating field:', error);
          },
        });
      };
      ```
  - [ ] **3. Header Section Enhancement (`src/app/opportunities/[id]/components/HeaderSection.tsx`)**
    - [ ] Wrap relevant text fields (e.g., name, value) with the `InlineEdit` component.
    - [ ] Implement permission checks for editing.
    - [ ] Handle updates to nested data structures.
  - [ ] **4. Bonus Details Section Enhancement (`src/app/opportunities/[id]/components/BonusDetailsSection.tsx`)**
    - [ ] Integrate `InlineEdit` components for bonus fields (e.g., title, description, requirements).
    - [ ] Handle the nested bonus data structure.

- [ ] **Phase 2: Type-Specific Customization**
  - [ ] **1. Field Configuration by Type (`src/config/fields.ts`)**
    - [ ] Create a configuration object (`EDITABLE_FIELDS`) mapping opportunity types to editable field paths.
    - [ ] Example:
      ```typescript
      const EDITABLE_FIELDS = {
        credit_card: ['name', 'value', 'bonus.description', 'details.annual_fees.amount', ...],
        bank: ['name', 'value', 'bonus.requirements', 'details.monthly_fees.amount', ...],
        brokerage: ['name', 'value', 'bonus.tiers', ...],
      };
      ```
  - [ ] **2. Enhanced InlineEdit Component**
    - [ ] Implement type-specific validation rules.
    - [ ] Dynamically display relevant fields based on opportunity type and `EDITABLE_FIELDS`.
    - [ ] Handle complex field types (nested objects, arrays).
    - [ ] Provide a "Fortune 10" look and feel during edit mode.

## Core Technologies

- **@radix-ui/react-editable:** Provides the foundation for inline editing primitives, ensuring accessibility and keyboard navigation.
- **@tanstack/react-query:** Manages data fetching, caching, and mutations, enabling efficient state management and optimistic updates.
- **@mui/material:** Offers a comprehensive set of UI components and styling tools for a consistent and professional look.

## Future Considerations

- [ ] **Rich Text Editing:** Explore options for rich text editing in description fields.
- [ ] **Form Validation:** Implement robust form validation to ensure data integrity.
- [ ] **Undo/Redo Functionality:** Consider adding undo/redo capabilities for a more advanced editing experience.
- [ ] **Real-time Collaboration:** Investigate real-time collaboration features for multi-user editing.

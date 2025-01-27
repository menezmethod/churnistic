# Modern Offer Details Implementation Plan

## Architecture

```typescript
// Core Dependencies:
// - @radix-ui/react-editable: For inline editing primitives
// - @tanstack/react-query: For data management
// - @mui/material: For styling and icons
```

## Phase 1: Basic Inline Editing

- [ ] Create Inline Edit Wrapper

```typescript:src/components/InlineEdit.tsx
// Combine Radix UI editable primitive with MUI styling
// Handle hover states and edit icons
// Manage focus and keyboard interactions
// Example usage:
//   <InlineEdit
//     value={opportunity.name}
//     onSave={(value) => updateField('name', value)}
//   >
//     <Typography>{opportunity.name}</Typography>
//   </InlineEdit>
```

- [ ] Add Field-Level Mutations

```typescript:src/app/opportunities/[id]/useOpportunityDetails.ts
// Add granular update functions:
const updateField = (id: string, field: string, value: any) => {
  return queryClient.mutate({
    mutationFn: (vars) => api.update(vars),
    onMutate: async (vars) => {
      // Optimistic update logic
    }
  })
}
```

- [ ] Enhance HeaderSection Component

```typescript:src/app/opportunities/[id]/components/HeaderSection.tsx
// Wrap text fields with InlineEdit
// Add permission checks
// Handle nested updates
```

- [ ] Enhance BonusDetailsSection Component

```typescript:src/app/opportunities/[id]/components/BonusDetailsSection.tsx
// Add InlineEdit to bonus fields
// Handle nested bonus data structure
```

## Phase 2: Type-Specific Features

- [ ] Add Field Config by Type

```typescript:src/config/fields.ts
// Define editable fields per type:
const EDITABLE_FIELDS = {
  credit_card: ['name', 'value', 'bonus.description', ...],
  bank: ['name', 'value', 'requirements', ...],
  brokerage: ['name', 'value', 'tiers', ...]
}
```

- [ ] Enhance InlineEdit for Types

```typescript
// Add type-specific validation
// Show relevant fields based on type
// Handle complex field types
```

## Testing & Deployment

- [ ] Test Inline Editing
- [ ] Test Type-Specific Features
- [ ] Deploy Phase 1
- [ ] Deploy Phase 2

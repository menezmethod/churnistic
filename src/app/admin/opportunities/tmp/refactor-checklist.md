# Opportunities Page Refactoring Checklist

## Original Structure Analysis

- [x] Review original code in `old_page_ref.tsx`
- [x] Identify all components, hooks, and types used
- [x] Map out dependencies and data flow

## Components to Extract

- [x] StatsCard Component

  - [x] Move to `@components/StatsCards/StatsCard.tsx`
  - [x] Keep exact same props and styling
  - [x] No additional type definitions needed

- [x] StatsGrid Component

  - [x] Move to `@components/StatsCards/StatsGrid.tsx`
  - [x] Use same stats structure from original
  - [x] Import StatsCard component

- [x] OpportunitiesTable Component

  - [x] Move to `@components/OpportunitiesTable.tsx`
  - [x] Keep same table structure and sorting
  - [x] Use same pagination logic
  - [x] Keep same action buttons

- [x] OpportunityTableRow Component

  - [x] Move to `@components/OpportunityTableRow.tsx`
  - [x] Extract row rendering logic
  - [x] Keep same status chip logic

- [x] SearchBar Component

  - [x] Move to `@components/SearchBar.tsx`
  - [x] Keep same search functionality
  - [x] Keep same styling and actions
  - [x] Maintain sync and bulk approve buttons

## Hooks to Extract

- [x] useOpportunities Hook
  - [x] Move to `@hooks/useOpportunities.ts`
  - [x] Keep same state management
  - [x] Keep same Firebase queries
  - [x] Use existing types only

## Types to Use (No New Types Needed)

- [x] Use existing `Opportunity` type from root types
- [x] Use existing pagination types
- [x] Remove any duplicate type definitions

## Integration

- [x] Update imports in page.tsx
- [x] Use absolute imports for better maintainability
- [x] Verify all components use same props
- [x] Ensure same functionality as original
- [x] Test all interactions

## Cleanup

- [ ] Remove old_page_ref.tsx
- [ ] Remove any unused files
- [ ] Remove any duplicate type definitions
- [ ] Fix any remaining import paths
- [ ] Verify no type errors

## Notes

- Keep exact same functionality as original
- Don't create new types, use existing ones
- Keep same prop structures
- Maintain same styling and layout

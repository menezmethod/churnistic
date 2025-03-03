# Firebase to Supabase Migration Plan

## 0. Database Schema Cleanup ✅

### Legacy Field Removal ✅

- [x] Remove Firebase-specific fields
  - [x] Drop `firestore_id` columns
  - [x] Drop `firebaseUid` from users table
  - [x] Update references in code

### Schema Optimization ✅

- [x] Standardize timestamp fields
  - [x] Add `created_at` defaults
  - [x] Add `updated_at` triggers
- [x] Add proper constraints
  - [x] Foreign keys
  - [x] Check constraints
  - [x] Unique constraints
- [x] Optimize JSONB fields
  - [x] Add GIN indexes
  - [x] Add validation

## 1. Core Database & Security ✅

- [x] Enable RLS on all tables
- [x] Set up user policies
  - [x] Read own profile
  - [x] Update own profile
- [x] Set up opportunities policies
  - [x] Public read for active
  - [x] Admin CRUD
- [x] Set up staged offers policies
  - [x] Admin CRUD
- [x] Enable realtime for relevant tables
- [x] Fix RLS policies for user profile creation
  - [x] Allow service role to manage all users
  - [x] Allow authenticated users to create their own profile
  - [x] Allow anon users to create profiles during sign-up
  - [x] Update is_admin function to handle edge cases

## 2. Directory Structure & Path Updates ✅

- [x] Move app directory to src/app
- [x] Update import paths in providers
  - [x] Fix theme import path
  - [x] Verify all @/app/\* imports
  - [x] Update path aliases
- [x] Ensure all components use correct paths
- [x] Update Next.js configuration

## 3. Firebase Dependency Removal ✅

### API Routes Migration ✅

- [x] Migrate API routes from Firebase to Supabase
  - [x] `/api/users` base route
  - [x] `/api/users/[id]` route
  - [x] `/api/opportunities/*` routes
    - [x] GET /api/opportunities
    - [x] POST /api/opportunities
    - [x] PUT /api/opportunities/[id]
    - [x] DELETE /api/opportunities/[id]
    - [x] GET /api/opportunities/stats
    - [x] GET /api/opportunities/public-stats
    - [x] POST /api/opportunities/approve
    - [x] POST /api/opportunities/[id]/reject
    - [x] POST /api/opportunities/import
  - [x] `/api/auth/*` routes
    - [x] Removed `/api/auth/session` (handled by Supabase)
    - [x] Removed `/api/auth/verify-session` (handled by Supabase)
    - [x] Migrated `/api/auth/initialize-claims` to use Supabase RPC
  - [x] `/api/functions/*` routes
    - [x] Deployed Edge Function: users
    - [x] Deployed Edge Function: stats
    - [x] Deployed Edge Function: approve_opportunity
  - [x] Health check endpoint

### Admin Functions Migration ✅

- [x] Migrate admin functionality
  - [x] User management
    - [x] List users function
    - [x] Set user role function
    - [x] Setup initial admin function
  - [x] Opportunity management
    - [x] Approve opportunities
    - [x] Get statistics
  - [x] Authentication claims
    - [x] Initialize claims Edge Function
    - [x] User role management
    - [x] Claims synchronization

### Client-Side Migration ✅

- [x] Remove Firebase client SDKs
  - [x] Remove `firebase/auth` from auth error handling
  - [x] Remove `firebase/auth` from opportunity actions
  - [x] Remove `firebase/firestore` from admin users page
  - [x] Remove `firebase/auth` from opportunity approval
  - [x] Remove `firebase/firestore` from dashboard data
  - [x] Remove `firebase/auth` from opportunities hook
  - [x] Remove `firebase/firestore` from opportunities hook
  - [x] Remove `firebase/auth` from settings page
  - [x] Remove `firebase/firestore` from settings page
  - [x] Remove `firebase/storage` from settings page
  - [x] Remove `firebase-admin/auth` from token verification
  - [x] Remove `firebase-admin/auth` from session handling
  - [x] Remove `firebase-admin/app` from admin initialization
  - [x] Remove `firebase-admin/firestore` from admin initialization
  - [x] Remove `firebase-functions` from users API
  - [x] Remove `firebase-admin/firestore` from verify route
  - [x] Remove remaining `firebase/app` imports
  - [x] Remove remaining `firebase/auth` imports
  - [x] Remove remaining `firebase/firestore` imports
  - [x] Remove remaining `firebase/storage` imports
  - [x] Remove remaining `firebase/functions` imports
  - [x] Update user types to remove Firebase-specific fields
  - [x] Update admin users page to use Supabase functionality

### Configuration Cleanup ✅

- [x] Remove Firebase config files
  - [x] Remove `src/lib/firebase/config.ts`
  - [x] Remove Firebase admin initialization
  - [x] Remove Firebase emulator configs
  - [x] Remove `firebase.json`
  - [x] Remove `.firebaserc`
  - [x] Remove `src/components/auth/FirebaseAuth.tsx`
  - [x] Remove `src/lib/auth/firebase.ts`
  - [x] Remove `src/lib/auth/__mocks__/firebase-admin.ts`
  - [x] Remove `src/app/api/firebase/admin.ts`
- [x] Remove Firebase environment variables
  - [x] Remove `FIREBASE_API_KEY` from `.env`
  - [x] Remove `FIREBASE_AUTH_DOMAIN` from `.env`
  - [x] Remove `FIREBASE_PROJECT_ID` from `.env`
  - [x] Remove `FIREBASE_STORAGE_BUCKET` from `.env`
  - [x] Remove `FIREBASE_MESSAGING_SENDER_ID` from `.env`
  - [x] Remove `FIREBASE_APP_ID` from `.env`
  - [x] Remove `FIREBASE_MEASUREMENT_ID` from `.env`
  - [x] Remove `FIREBASE_ADMIN_PROJECT_ID` from `.env`
  - [x] Remove `FIREBASE_ADMIN_CLIENT_EMAIL` from `.env`
  - [x] Remove `FIREBASE_ADMIN_PRIVATE_KEY` from `.env`
  - [x] Update deployment environment variables
- [x] Update deployment scripts
  - [x] Remove Firebase deploy commands from `package.json`
  - [x] Add Supabase deploy commands to `package.json`
  - [x] Update CI/CD pipelines
- [x] Remove Firebase emulator configurations
  - [x] Remove `firebase.json`
  - [x] Remove `.firebaserc`
  - [x] Remove emulator data directories

## 4. Authentication Migration ✅

- [x] Set up Supabase auth infrastructure
  - [x] Client setup
  - [x] Server setup
  - [x] Middleware configuration
- [x] Create auth callback page for OAuth
- [x] Update SignIn component
- [x] Update SignUp component
- [x] Create email verification page
- [x] Update ForgotPassword component
- [x] Create reset password page
- [x] Migrate existing users
- [x] Update auth hooks to use @supabase/ssr
  - [x] Update useSession hook
  - [x] Update session verification utilities
  - [x] Remove legacy auth helpers
- [x] Complete Email Service Setup
  - [x] Configure SMTP settings
  - [x] Set up email templates
  - [x] Test all email flows
- [x] Test all auth flows
  - [x] Email/Password sign in
  - [x] Google OAuth sign in
  - [x] Password reset flow
  - [x] Email verification flow
  - [x] User migration verification

## 5. Supabase Client Migration ✅

- [x] Update Supabase client initialization
  - [x] Replace @supabase/auth-helpers-nextjs with @supabase/ssr
  - [x] Update createClient calls to use createBrowserClient
  - [x] Update server-side client creation to use createServerClient
- [x] Update middleware
  - [x] Replace createMiddlewareClient with createServerClient
  - [x] Update cookie handling
- [x] Update hooks
  - [x] Update useSession to use Supabase client directly
  - [x] Update useOpportunity to use Supabase client
  - [x] Update auth utilities to use @supabase/ssr
- [x] Clean up legacy auth code
  - [x] Remove duplicate useSession implementations
  - [x] Update session verification utilities

# Migration Instructions for LLM

# Migration Preparation Checklist for LLM-Assisted Development

1. **Firebase Dependency Removal** (In Progress)

   - [x] Create timestamped backup of all Firebase-related files in `/tmp/firebase_backup`
   - [x] Document backup structure for easy reference
   - [x] Supabase Setup
     - [x] Initialize Supabase project
     - [x] Link project with CLI
     - [x] Pull database schema
     - [x] Verify database connection
     - [x] Migrate existing data
   - [ ] Identify and remove all Firebase SDK imports and initialization code (Next Priority)
   - [ ] Replace Firebase-specific methods with Supabase equivalents
   - [ ] Remove Firebase configuration files and environment variables

2. **Authentication Migration** (In Progress)

   - [x] Set up Supabase auth infrastructure
     - [x] Client setup
     - [x] Server setup
     - [x] Middleware configuration
   - [x] Create auth callback page for OAuth
   - [x] Update SignIn component with Supabase auth
   - [x] Update SignUp component with Supabase auth
   - [x] Create email verification page
   - [x] Update ForgotPassword component
   - [x] Create reset password page
   - [x] Migrate existing users
   - [x] Update client code to use @supabase/ssr
     - [x] Replace auth helpers with recommended package
     - [x] Update hooks to use new client patterns
     - [x] Clean up legacy auth code
   - [ ] Email Service Setup (Priority)
     - [x] Configure SMTP settings in Supabase
     - [x] Set up email templates
       - [x] Email verification
       - [x] Password reset
       - [x] Welcome email
     - [x] Test email delivery
   - [ ] Test all auth flows
     - [x] Email/Password sign in
     - [x] Google OAuth sign in
     - [x] Password reset flow
     - [ ] Email verification flow
     - [ ] User migration verification

3. **Test-Driven Migration Approach**

   - [ ] Write tests for each feature before migration
   - [ ] Base test patterns on:
     - Next.js 15 best practices
     - React Query v5 documentation
     - Supabase client patterns
   - [ ] Focus on:
     - Bug prevention over bug fixing
     - Type safety improvements
     - Performance optimizations
     - Code maintainability

4. **Structured Migration Workflow**
   - [x] Follow migration checklist for each feature
   - [x] Maintain detailed documentation of:
     - Migration steps taken
     - Decisions made
     - Issues encountered
   - [ ] Implement version control best practices:
     - Atomic commits
     - Descriptive commit messages
     - Feature branches
   - [ ] Verify each migration step before proceeding

## 2. Data Display & Hooks 🚧 (Next Priority)

### Opportunities

- [x] Core Opportunity Hooks (React Query v5 Migration)
  - [x] Type-safe Supabase client setup
  - [x] Database types definition
  - [x] Update hooks to use @supabase/ssr
  - [x] `useOpportunities` - Main hook for opportunity listing and filtering
    - [x] Infinite query pagination with cursor-based pagination
    - [x] Search functionality with debounce
    - [x] Type filtering with URL sync
    - [x] Status filtering with URL sync
    - [x] Sorting with stable sort keys
    - [x] Error handling with error boundaries
    - [x] Loading states with suspense
    - [x] Optimistic updates
    - [x] Cache invalidation strategy
    - [x] Real-time updates with Supabase subscriptions
  - [x] `useOpportunity` - Single opportunity fetch and management
    - [x] Fetch by ID with proper type safety
    - [x] Cache management with staleTime/cacheTime
    - [x] Real-time updates with cache synchronization
    - [x] Optimistic updates for edits
  - [x] `useOpportunityFilters` - Filter management
    - [x] Filter persistence in URL
    - [x] URL sync with React Query state
    - [x] Reset functionality with cache clear
    - [x] Type-safe filter parameters
    - [x] Debounced search
    - [x] Integration with React Query
  - [x] `useOpportunityForm` - Form handling and validation
    - [x] Update to use Supabase client directly
    - [x] Form state management with React Hook Form
    - [x] Validation rules with Zod
    - [x] Submit handling with proper types
    - [x] Error handling with toast messages
    - [x] Optimistic updates
  - [x] `useOpportunityManagement` - Admin operations
    - [x] Create with proper validation
    - [x] Update with optimistic updates
    - [x] Delete with confirmation
    - [x] Status changes with real-time sync
    - [x] Batch operations with transaction support

### Bug Fixes 🐛

- [x] Inline Editing
  - [x] Fix race conditions in save operations
  - [x] Add proper error handling
  - [x] Implement optimistic updates
  - [x] Add retry logic
  - [x] Fix validation timing
  - [x] Add loading states
  - [x] Improve error messages
  - [x] Fix click-away behavior
- [x] Form Submissions
  - [x] Fix double submission issues
  - [x] Add proper validation
  - [x] Improve error handling
  - [x] Add loading states
- [x] Real-time Updates
  - [x] Fix stale data issues
  - [x] Implement proper cache invalidation
  - [x] Handle offline scenarios
  - [x] Add reconnection logic
- [x] Database Schema Compatibility
  - [x] Add mapping functions to convert between snake_case (database) and camelCase (frontend)
  - [x] Update type definitions to match Supabase's schema
  - [x] Update hooks to handle snake_case column names
  - [x] Ensure proper field mapping in all database operations

### React Query v5 Best Practices ✨

- [ ] Query Keys
  - [ ] Implement type-safe query keys
  - [ ] Use proper key factories
  - [ ] Implement key prefixing
- [ ] Cache Management
  - [ ] Set up proper staleTime/cacheTime
  - [ ] Implement cache invalidation
  - [ ] Set up optimistic updates
  - [ ] Handle cache persistence
- [ ] Error Handling
  - [ ] Set up global error boundary
  - [ ] Implement retry logic
  - [ ] Add error recovery
  - [ ] Improve error messages
- [ ] Performance
  - [ ] Implement suspense mode
  - [ ] Set up proper prefetching
  - [ ] Optimize re-renders
  - [ ] Handle parallel queries
- [ ] TypeScript Integration
  - [ ] Set up proper type inference
  - [ ] Add type guards
  - [ ] Implement error types
  - [ ] Add response types

### Staged Offers

- [ ] List View
  - [ ] Fetch pending offers
  - [ ] Filter by status
  - [ ] Sort functionality
  - [ ] Pagination
  - [ ] Search
- [ ] Review System
  - [ ] Approve offer (`approveStagedOffer`)
    - [ ] Validation checks
    - [ ] Status updates
    - [ ] Notifications
  - [ ] Reject offer (`rejectStagedOffer`)
    - [ ] Reason tracking
    - [ ] Status updates
    - [ ] Notifications
  - [ ] Add review notes
    - [ ] Note history
    - [ ] Attachments
- [ ] Management
  - [ ] Create staged offer
  - [ ] Edit staged offer
  - [ ] Delete staged offer
  - [ ] Workflow tracking

### User Management

- [x] Authentication & Session
  - [x] `useAuth` - Main auth context
    - [x] Sign up
    - [x] Sign in
    - [x] Sign out
    - [x] Password reset
    - [x] Email verification
    - [x] OAuth providers
  - [x] `useAuthError` - Error handling
    - [x] Error types
    - [x] Error messages
    - [x] Recovery actions
  - [x] `useSession` - Session management
    - [x] Session persistence
    - [x] Token refresh
    - [x] Role management
- [x] User Data
  - [x] `useUsers` - Admin user management
    - [x] List users
    - [x] Filter users
    - [x] Sort users
    - [x] User actions
    - [x] Edit user modal
    - [x] Delete user functionality
  - [x] Profile management
    - [x] View profile
    - [x] Edit profile
    - [x] Avatar handling
  - [x] Settings management
    - [x] User preferences
    - [x] Notification settings
    - [x] Privacy settings
- [ ] Notifications
  - [x] `useNotifications` - Notification system
  - [ ] `useNotificationSettings` - User preferences

### Dashboard

- [ ] `useDashboardData`
  - [ ] Statistics
    - [ ] Opportunity metrics
    - [ ] User metrics
    - [ ] Success rates
  - [ ] Analytics
    - [ ] Charts
    - [ ] Reports
    - [ ] Exports
  - [ ] Summary data
    - [ ] Recent activity
    - [ ] Important updates
    - [ ] Quick actions

### API Routes

- [ ] Opportunities
  - [ ] CRUD endpoints
  - [ ] Search endpoint
  - [ ] Filter endpoint
  - [ ] Status update endpoint
- [ ] Users
  - [ ] Profile endpoints
  - [ ] Settings endpoints
  - [ ] Admin endpoints
- [ ] Auth
  - [ ] Login endpoints
  - [ ] Registration endpoints
  - [ ] Password reset
- [ ] Admin
  - [ ] Management endpoints
  - [ ] Analytics endpoints
  - [ ] System settings

### UI & Utilities

- [ ] `useToast` - Toast notifications
  - [ ] Success messages
  - [ ] Error messages
  - [ ] Warning messages
  - [ ] Custom messages
- [ ] `useTheme`

## Supabase Migration

This document tracks the progress of migrating from Firebase to Supabase.

### Database Migration

- [x] Enable RLS on all tables
- [x] Set up user policies for each table
- [x] Migrate data from Firebase to Supabase
- [x] Update database schema to match Supabase requirements
- [x] Set up foreign key constraints
- [x] Set up indexes for performance
- [x] Set up triggers for automatic updates

### Authentication Migration (In Progress)

- [x] Set up Supabase authentication
- [x] Migrate user accounts from Firebase to Supabase
- [x] Update authentication hooks to use Supabase
- [x] Update session management to use Supabase
- [x] Update user profile management to use Supabase
- [ ] Test authentication flow end-to-end
- [ ] Update password reset flow
- [ ] Update email verification flow

### API Migration

- [x] Migrate API routes from Firebase to Supabase
- [x] Update API endpoints to use Supabase client
- [x] Update API error handling
- [x] Update API response format
- [x] Test API endpoints

### Supabase Client Migration (In Progress)

- [x] Update `useSession` hook to use `@supabase/ssr` package
- [x] Update `useOpportunity` hook to use Supabase client
- [x] Update `useOpportunities` hook to use Supabase client with pagination, filtering, and search
- [x] Update `useOpportunityFilters` hook to integrate with React Query and URL synchronization
- [x] Update `useOpportunityForm` hook to use React Hook Form with Zod validation and Supabase client
- [x] Update `useUser` hook to use Supabase client
- [ ] Update `useUsers` hook to use Supabase client
- [ ] Update `useStagedOffers` hook to use Supabase client
- [ ] Update UI utilities to use Supabase storage

### Testing

- [ ] Write tests for Supabase authentication
- [ ] Write tests for Supabase API endpoints
- [ ] Write tests for Supabase client hooks
- [ ] Write integration tests for Supabase client and API
- [ ] Write end-to-end tests for Supabase authentication flow

### Deployment

- [ ] Update deployment scripts to use Supabase
- [ ] Update environment variables for Supabase
- [ ] Test deployment to staging environment
- [ ] Test deployment to production environment

### Documentation

- [ ] Update documentation for Supabase authentication
- [ ] Update documentation for Supabase API endpoints
- [ ] Update documentation for Supabase client hooks
- [ ] Update documentation for Supabase storage

## Completed Tasks

### Hooks Migration

#### useSession

- [x] Replaced direct use of `@supabase/supabase-js` with `@supabase/ssr`
- [x] Integrated cookie handling for server-side rendering
- [x] Added auth state listener for real-time updates
- [x] Improved error handling and loading states

#### useOpportunity

- [x] Transitioned from Firebase types to Supabase types
- [x] Implemented direct Supabase client queries
- [x] Added optimistic updates for better UX
- [x] Enhanced error handling and loading states
- [x] Integrated with React Query for caching and state management

#### useOpportunities

- [x] Implemented cursor-based pagination for better performance
- [x] Added search functionality with debouncing
- [x] Integrated filtering with URL synchronization
- [x] Added real-time updates for opportunities
- [x] Enhanced error handling and loading states

#### useOpportunityFilters

- [x] Implemented URL synchronization for filter persistence
- [x] Added debounced search functionality
- [x] Integrated with React Query for caching
- [x] Enhanced filter reset functionality
- [x] Improved type safety with TypeScript

#### useOpportunityForm

- [x] Migrated to React Hook Form with Zod validation
- [x] Implemented direct Supabase client mutations
- [x] Added optimistic updates for better UX
- [x] Enhanced error handling and form validation
- [x] Added support for both create and edit modes
- [x] Integrated with React Query for cache invalidation
- [x] Maintained backward compatibility with existing components

#### useUser

- [x] Removed dependency on `authService.ts` for better maintainability
- [x] Implemented direct Supabase client queries
- [x] Enhanced user profile data fetching and creation
- [x] Improved error handling and loading states
- [x] Added automatic profile creation for new users
- [x] Integrated with React Query for caching and state management

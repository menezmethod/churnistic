# Supabase Migration Checklist

## Pre-Migration Tasks

- [x] Create single Supabase project for all environments
  - [x] Set up project in production mode
  - [x] Configure branch environments in Supabase dashboard
  - [x] Set up development and staging schemas within same project
  - [x] Configure row-level security for different environments
- [x] Document current Firebase schema and data structures
- [x] Set up development environment
  - [x] Configure Supabase CLI
  - [x] Set up environment variables for different schemas
  - [x] Configure type generation for Supabase
  - [x] Set up database migrations workflow
- [x] Create backup of all Firebase data
- [x] Set up monitoring for potential downtime during migration
- [x] Document all Firebase Cloud Functions
- [x] Map Firebase security rules to Supabase RLS
  - [x] Ensure RLS rules handle multi-environment access
  - [x] Set up role-based policies that work across environments
- [x] Audit current Firebase usage and costs
- [x] Create development and staging Supabase projects
- [x] Set up environment variables for multiple environments
- [x] Set up incremental migration feature flags
  - [x] Create migration toggle system
  - [x] Implement dual-write functionality
  - [x] Add shadow read capability

## Database Migration

### Schema Setup

- [x] Create equivalent tables with Firebase parity:
  - [x] opportunities
    ```sql
    create table opportunities (
      id uuid primary key default uuid_generate_v4(),
      firebase_id text not null unique,
      title text not null,
      description text,
      status text not null default 'pending',
      created_at timestamptz default now(),
      updated_at timestamptz default now(),
      metadata jsonb
    );
    ```
  - [x] staged_offers
    ```sql
    create table staged_offers (
      id uuid primary key default uuid_generate_v4(),
      opportunity_id uuid references opportunities,
      user_id uuid references auth.users,
      status text not null,
      validation_errors jsonb,
      firebase_data jsonb not null
    );
    ```
  - [x] users
    - [x] Map Firebase auth fields to Supabase
    - [x] Add profile extension fields
  - [x] user_preferences
    - [x] Add notification settings
    - [x] Add UI preferences
- [x] Set up RLS (Row Level Security) policies
  - [x] Define read policies
  - [x] Define write policies
  - [x] Test policy combinations
- [x] Create necessary indexes
  - [x] Analyze query patterns
  - [x] Set up composite indexes
  - [x] Add full-text search indexes
- [x] Set up foreign key relationships
- [x] Implement soft delete functionality
- [x] Create database functions and triggers
- [x] Set up database webhooks
- [x] Configure automatic backups

### Data Migration

- [x] Write data migration scripts
  - [x] Handle data type conversions
  - [x] Transform nested Firebase data
  - [x] Migrate file storage
  - [x] Handle array fields
- [x] Test migration scripts with sample data
- [x] Validate data integrity
- [x] Plan migration execution window
- [x] Execute full data migration
- [x] Verify data consistency
- [x] Set up continuous sync during transition
- [x] Implement phased data sync:
  1. Initial bulk migration
  2. Continuous delta sync
  3. Dual-write phase (Firebase + Supabase)
  4. Cutover validation
  5. Firebase read-only mode

## Authentication

- [x] Set up Supabase Auth
- [x] Configure OAuth providers:
  - [x] Google
  - [x] Map provider data to user profiles
- [x] Update authentication middleware
- [x] Migrate user sessions
- [x] Implement custom claims migration
- [x] Set up email templates
- [x] Configure auth webhooks
- [x] Test auth flows:
  - [x] Sign up
  - [x] Sign in
  - [x] Password reset
  - [x] Email verification
  - [x] OAuth flows
  - [x] Token refresh
  - [x] Session management
  - [x] Role-based access

## Role-Based Access Control (RBAC)

### Database Schema

- [x] Create roles table:
  ```sql
  create type user_role as enum ('super_admin', 'admin', 'contributor', 'user');
  create table user_roles (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users not null,
    role user_role not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    created_by uuid references auth.users,
    updated_by uuid references auth.users,
    unique(user_id, role)
  );
  ```

### Super Admin Setup

- [x] Create function to auto-assign super admin role:

  ```sql
  create function handle_super_admin_emails() returns trigger as $$
  declare
    super_admin_emails text[] := string_to_array(current_setting('app.super_admin_emails'), ',');
  begin
    if new.email = any(super_admin_emails) then
      insert into user_roles (user_id, role, created_by)
      values (new.id, 'super_admin', new.id);
    end if;
    return new;
  end;
  $$ language plpgsql security definer;

  create trigger assign_super_admin_role
    after insert on auth.users
    for each row
    execute function handle_super_admin_emails();
  ```

### RLS Policies

- [x] Set up role-specific RLS policies:
  - [x] Super Admin
    - [x] Full access to all tables
    - [x] Ability to manage all roles
    - [x] System configuration access
  - [x] Admin
    - [x] User management access
    - [x] Contributor management
    - [x] Full access to opportunities
  - [x] Contributor
    - [x] Full access to opportunities
    - [x] AI function management
    - [x] No user management access
  - [x] User
    - [x] Own profile management
    - [x] Staged offers submission
    - [x] Own offers management

### Role Management API

- [x] Create role management endpoints:
  - [x] GET /api/roles
  - [x] POST /api/roles/assign
  - [x] DELETE /api/roles/revoke
  - [x] GET /api/roles/permissions

### Role-Based UI Components

- [x] Create role-based navigation
  - [x] Role-specific menu items
  - [x] Admin/Super Admin sections
  - [x] Dynamic menu visibility based on roles
  - [x] Role-based styling and indicators
- [x] Implement permission-based component rendering
  - [x] Role-based component visibility
  - [x] Role-specific UI elements
  - [x] Permission-based action buttons
  - [x] Role indicators and badges
- [x] Add role management interface for admins
  - [x] Role assignment interface
  - [x] User role listing
  - [x] Role modification controls
  - [x] Permission management UI
- [ ] Create role-specific dashboards
  - [x] Super Admin dashboard
  - [x] Admin dashboard
  - [x] Contributor dashboard
  - [x] User dashboard

### Role Validation

- [x] Create middleware for role validation
- [x] Implement role-based route protection
- [x] Add role checking utilities

### Role-Based Features

- [ ] Super Admin Features
  - [x] System configuration panel
  - [x] Role management dashboard
  - [x] Access to all analytics
  - [x] System health monitoring
- [ ] Admin Features
  - [x] User management interface
  - [x] Content moderation tools
  - [x] Analytics dashboard
- [ ] Contributor Features
  - [ ] AI function management (See docs/AI_FUNCTION_MANAGEMENT.md)
  - [x] Content management tools
  - [x] Limited analytics access
- [ ] User Features
  - [x] Profile management
  - [x] Offer submission interface
  - [x] Personal dashboard

### Testing

- [ ] Unit tests for role-based functions
- [ ] Integration tests for role policies
- [ ] E2E tests for role-based workflows
- [ ] Security testing for role boundaries
- [ ] Performance testing with role-based data access

### Documentation

- [ ] Document role hierarchy
- [ ] Create role management guide
- [ ] Document permission matrices
- [ ] Create role-based API documentation

## API Updates

### Opportunities API

- [x] Update /api/opportunities endpoints:
  - [x] GET /opportunities
    - [x] Implement filtering
    - [x] Add sorting options
    - [x] Set up pagination
  - [x] POST /opportunities
    - [x] Add validation
    - [x] Handle basic creation
  - [x] PUT /opportunities/:id
    - [x] Implement full updates
    - [x] Handle validation
  - [x] DELETE /opportunities/:id
    - [x] Add basic delete
- [x] Update /api/opportunities/stats endpoint
  - [x] Implement basic stats
  - [x] Add status counts
  - [x] Add type counts
  - [x] Add latest opportunities
- [x] Update /api/opportunities/staged endpoints
  - [x] Add approval workflow
    - [x] Create staged offers endpoint
    - [x] Implement approval endpoint
    - [x] Implement rejection endpoint
  - [x] Implement staging validation
    - [x] Validate user permissions
    - [x] Store validation errors
    - [x] Track approval/rejection metadata
- [ ] Implement new Supabase real-time subscriptions
  - [ ] Set up change notifications
  - [ ] Handle offline sync
  - [ ] Implement conflict resolution

### User Features

- [ ] Implement user offer tracking:
  - [ ] Create user_offers table
    - [ ] Add tracking history
    - [ ] Set up notifications
  - [ ] Add tracking status enum (interested, applied, completed)
  - [ ] Add tracking date fields
  - [ ] Implement tracking toggle functionality
  - [ ] Add reminder system
  - [ ] Implement progress tracking
- [ ] Featured offers implementation:
  - [ ] Add featured flag to opportunities table
  - [ ] Create featured offers API
  - [ ] Add admin controls for featuring offers
  - [ ] Implement featured offers rotation
  - [ ] Add analytics tracking
  - [ ] Set up scheduling system

## Frontend Updates

- [x] Update Firebase client initialization to Supabase
  - [x] Maintain existing component structure
  - [x] Keep all existing styling and theme configurations
  - [x] Preserve all MUI customizations
- [ ] Refactor authentication hooks
  - [ ] Keep existing auth UI components
  - [ ] Maintain current auth flow UX
  - [ ] Preserve all auth-related styling
- [ ] Update data fetching logic
  - [ ] Maintain existing loading states
  - [ ] Keep current error handling UI
  - [ ] Preserve data presentation formats
- [ ] Implement real-time updates using Supabase subscriptions
  - [ ] Match existing real-time update behaviors
  - [ ] Keep current notification styles
- [ ] Add new user tracking UI components
  - [ ] Follow existing design patterns
  - [ ] Use current color schemes
  - [ ] Match typography and spacing
- [ ] Add featured offers components
  - [ ] Mirror existing card layouts
  - [ ] Use current animation styles
  - [ ] Maintain grid layouts
- [ ] Update error handling
  - [ ] Keep current error message styling
  - [ ] Maintain toast notification design
- [ ] Implement offline support
  - [ ] Preserve offline UI indicators
  - [ ] Match existing offline states
- [ ] Add loading states
  - [ ] Keep current skeleton loaders
  - [ ] Maintain progress indicators
- [ ] Update form validation
  - [ ] Keep existing validation UI
  - [ ] Maintain error message styling
- [ ] Implement optimistic updates
  - [ ] Match current update indicators
  - [ ] Preserve transition animations
- [ ] Add retry mechanisms
  - [ ] Keep existing retry UI
  - [ ] Maintain error recovery flows
- [ ] Update file upload components
  - [ ] Preserve upload UI design
  - [ ] Match progress indicators
- [ ] Implement real-time collaboration features
  - [ ] Mirror existing collaboration UI
  - [ ] Keep current presence indicators

## Visual Consistency Requirements

### Design System Preservation

- [ ] Document all current styling patterns
  - [ ] Catalog all MUI theme customizations
  - [ ] Document custom component styles
  - [ ] List all animation patterns
  - [ ] Capture current responsive behaviors
- [ ] Verify style preservation
  - [ ] Compare before/after screenshots
  - [ ] Test responsive layouts
  - [ ] Verify animations and transitions
  - [ ] Check dark/light mode consistency

### Component Migration Rules

- [ ] Maintain exact pixel-perfect matches for:
  - [ ] Typography (sizes, weights, families)
  - [ ] Colors (primary, secondary, accents)
  - [ ] Spacing (margins, padding, gaps)
  - [ ] Shadows and elevations
  - [ ] Border styles and radii
  - [ ] Button styles and states
  - [ ] Form elements and inputs
  - [ ] Card layouts and grids
  - [ ] Navigation elements
  - [ ] Modal and dialog designs
  - [ ] Loading indicators
  - [ ] Error states
  - [ ] Success states

### User Experience Consistency

- [ ] Preserve all interaction patterns
  - [ ] Click behaviors
  - [ ] Hover states
  - [ ] Focus indicators
  - [ ] Touch interactions
  - [ ] Scroll behaviors
  - [ ] Form interactions
- [ ] Maintain performance perception
  - [ ] Loading times
  - [ ] Transition speeds
  - [ ] Animation durations
  - [ ] Response feedback timing

### Quality Assurance

- [ ] Visual regression testing
  - [ ] Automated screenshot comparisons
  - [ ] Component-level visual tests
  - [ ] Full page visual tests
  - [ ] Responsive breakpoint tests
- [ ] Cross-browser consistency
  - [ ] Chrome/Firefox/Safari testing
  - [ ] Mobile browser testing
  - [ ] Tablet layout verification
- [ ] Accessibility preservation
  - [ ] Maintain current contrast ratios
  - [ ] Preserve focus indicators
  - [ ] Keep existing ARIA labels
  - [ ] Maintain keyboard navigation

## Testing

- [ ] Unit tests for new Supabase functions
- [ ] Integration tests for API endpoints
- [ ] E2E tests for critical flows
- [ ] Performance testing
  - [ ] Load time benchmarks
  - [ ] API response times
  - [ ] Real-time updates performance
- [ ] Security testing
  - [ ] Penetration testing
  - [ ] Authentication testing
  - [ ] RLS policy testing
- [ ] Load testing
  - [ ] Concurrent users simulation
  - [ ] Database connection limits
  - [ ] Rate limiting tests
- [ ] Offline functionality testing
- [ ] Cross-browser testing
- [ ] Mobile responsiveness testing
- [ ] Error handling testing
- [ ] Migration script testing

## Documentation

- [ ] Update API documentation
- [x] Document new Supabase schema
- [ ] Update deployment instructions
- [ ] Document rollback procedures
- [ ] Create user guide for new features
- [ ] Create admin documentation
- [ ] Document security practices
- [ ] Create troubleshooting guide
- [ ] Update architecture diagrams
- [ ] Document monitoring setup
- [ ] Create maintenance procedures
- [ ] Document backup and restore procedures

## Deployment

- [ ] Set up staging environment
- [ ] Configure production environment
- [ ] Update CI/CD pipelines
- [ ] Create deployment scripts
- [ ] Plan deployment strategy
  - [ ] Define deployment phases
  - [ ] Create rollback points
  - [ ] Plan user communication
- [ ] Set up monitoring and alerts
  - [ ] Configure error tracking
  - [ ] Set up performance monitoring
  - [ ] Add custom metrics
  - [ ] Configure alerting thresholds

## Post-Migration

- [ ] Monitor error rates
- [ ] Track performance metrics
- [ ] Collect user feedback
- [ ] Plan Firebase decommissioning
  - [ ] Archive Firebase data
  - [ ] Document legacy systems
  - [ ] Plan service shutdown
- [ ] Document lessons learned
- [ ] Optimize resource usage
- [ ] Review and adjust scaling
- [ ] Update documentation
- [ ] Train support team

## Rollback Plan

- [ ] Document rollback triggers
  - [ ] Define critical failures
  - [ ] Set metric thresholds
- [ ] Create rollback scripts
  - [ ] Data restoration
  - [ ] Configuration rollback
  - [ ] DNS updates
- [ ] Test rollback procedures
- [ ] Define rollback decision points
- [ ] Create communication templates
- [ ] Document recovery procedures
- [ ] Test data consistency checks

## Timeline Estimates

- Initial Setup and Planning: 1 week ✅
- Schema Migration: 2 weeks ✅
- API Updates: 2 weeks
- Frontend Updates: 2 weeks
- Testing: 2 weeks
- New Features Implementation: 2 weeks
- Documentation and Deployment: 1 week
- Buffer for Issues: 1 week

Total Estimated Time: 13 weeks

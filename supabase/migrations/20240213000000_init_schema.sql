-- Drop triggers first
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists assign_super_admin_role on auth.users;

-- Drop functions
drop function if exists handle_new_user() cascade;
drop function if exists handle_super_admin_emails() cascade;
drop function if exists update_updated_at_column() cascade;

-- Drop tables (this will automatically drop their policies)
drop table if exists user_offers cascade;
drop table if exists staged_offers cascade;
drop table if exists opportunities cascade;
drop table if exists user_roles cascade;
drop table if exists user_preferences cascade;
drop table if exists system_settings cascade;

-- Drop types
drop type if exists user_role cascade;
drop type if exists opportunity_type cascade;
drop type if exists tracking_status cascade;

-- Create types
create type user_role as enum ('super_admin', 'admin', 'contributor', 'user');
create type opportunity_type as enum ('credit_card', 'bank_account', 'brokerages');
create type tracking_status as enum ('interested', 'applied', 'completed', 'not_interested');

-- Create tables
create table user_roles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) ON DELETE CASCADE not null,
  role user_role not null default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

create table user_preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  notifications jsonb default '{"email": true, "push": true}'::jsonb,
  preferences jsonb default '{"theme": "system", "language": "en"}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

create table opportunities (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  status text not null default 'pending',
  type opportunity_type,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  metadata jsonb
);

create table staged_offers (
  id uuid primary key default uuid_generate_v4(),
  opportunity_id uuid references opportunities,
  user_id uuid references auth.users,
  status text not null,
  validation_errors jsonb,
  data jsonb not null
);

create table user_offers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  opportunity_id uuid references opportunities not null,
  status tracking_status not null default 'interested',
  notes text,
  reminder_date timestamptz,
  applied_date timestamptz,
  completed_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  metadata jsonb,
  unique(user_id, opportunity_id)
);

create table system_settings (
  id uuid primary key default uuid_generate_v4(),
  maintenance_mode boolean default false,
  rate_limits jsonb default '{"max_requests": 50, "window_ms": 60000}'::jsonb,
  notifications jsonb default '{"enabled": true, "batch_size": 100}'::jsonb,
  scraper jsonb default '{"max_concurrency": 2, "timeout_secs": 30}'::jsonb,
  features jsonb default '{"analytics_enabled": true, "ai_functions_enabled": true, "real_time_enabled": true}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create updated_at trigger function
create function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add updated_at triggers
create trigger set_timestamp
  before update on opportunities
  for each row
  execute function update_updated_at_column();

create trigger set_timestamp
  before update on user_roles
  for each row
  execute function update_updated_at_column();

create trigger set_timestamp
  before update on user_offers
  for each row
  execute function update_updated_at_column();

-- Ensure proper grants
grant usage on schema public to postgres, authenticated, anon, service_role;
grant all on all tables in schema public to postgres, service_role;
grant all on all sequences in schema public to postgres, service_role;
grant all on all functions in schema public to postgres, service_role;

-- Enable RLS and set policies
alter table user_roles enable row level security;

-- Drop all existing policies
drop policy if exists "Users can view their own role" on user_roles;
drop policy if exists "Service role can manage all roles" on user_roles;
drop policy if exists "Super admins can manage all roles" on user_roles;
drop policy if exists "Users can update their own role" on user_roles;
drop policy if exists "Authenticated users can read roles" on user_roles;
drop policy if exists "Enable read access for authenticated users" on user_roles;
drop policy if exists "Enable read access for anon" on user_roles;
drop policy if exists "Enable insert for service role" on user_roles;
drop policy if exists "Enable all for service role" on user_roles;
drop policy if exists "authenticated_read" on user_roles;
drop policy if exists "service_role_all" on user_roles;
drop policy if exists "enable_read_access_for_all_users" on user_roles;
drop policy if exists "enable_all_for_service_role" on user_roles;
drop policy if exists "users_read_own" on user_roles;
drop policy if exists "super_admin_all" on user_roles;
drop policy if exists "enable_read_for_authenticated_users" on user_roles;
drop policy if exists "allow_read_own_role" on user_roles;
drop policy if exists "allow_service_role_all" on user_roles;

-- Create policies for user_roles
create policy "enable_read_for_all"
  on user_roles for select
  using (true);

create policy "enable_insert_for_authenticated"
  on user_roles for insert
  with check (auth.uid() = user_id);

create policy "enable_update_for_authenticated"
  on user_roles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "enable_all_for_service_role"
  on user_roles for all
  using (auth.jwt() ->> 'role' = 'service_role');

-- Reset grants
revoke all privileges on user_roles from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on user_roles to anon, authenticated;
grant insert, update on user_roles to authenticated;

-- Enable RLS on other tables
alter table opportunities enable row level security;
alter table staged_offers enable row level security;
alter table user_offers enable row level security;
alter table user_preferences enable row level security;
alter table system_settings enable row level security;

-- Basic table policies
create policy "Users can view published opportunities"
  on opportunities for select
  using (status = 'published');

create policy "Users can manage their own preferences"
  on user_preferences for all
  using (auth.uid() = user_id);

create policy "Users can manage their own offers"
  on user_offers for all
  using (auth.uid() = user_id);

create policy "Users can manage their staged offers"
  on staged_offers for all
  using (auth.uid() = user_id);

-- Grant basic access
grant select on opportunities to authenticated;
grant all on user_preferences to authenticated;
grant all on user_offers to authenticated;
grant all on staged_offers to authenticated; 
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  role text not null default 'user',
  created_at timestamp with time zone default now(),
  
  primary key (id)
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
on public.profiles for select
using (true);

create policy "Users can insert their own profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id); 
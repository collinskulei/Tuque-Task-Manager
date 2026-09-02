-- M0: foundation schema — profiles, projects, tasks, all with RLS enabled from creation.
-- Scope for now: any authenticated user is a trusted org member (single internal org).
-- Per-project membership / role-based restrictions land in M2 (project_members) and M4 (RBAC).

create extension if not exists "pgcrypto";

-- profiles ------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles are viewable by authenticated users"
  on profiles for select
  to authenticated
  using (true);

create policy "users can update their own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

-- auto-create a profile row whenever a new auth user signs up
create function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- projects --------------------------------------------------------------

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now()
);

alter table projects enable row level security;

create policy "projects are viewable by authenticated users"
  on projects for select
  to authenticated
  using (true);

create policy "authenticated users can create projects"
  on projects for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "creators can update their projects"
  on projects for update
  to authenticated
  using (auth.uid() = created_by);

create policy "creators can delete their projects"
  on projects for delete
  to authenticated
  using (auth.uid() = created_by);

-- tasks -------------------------------------------------------------------

create table tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo',
  assignee_id uuid references profiles (id),
  due_date date,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table tasks enable row level security;

create policy "tasks are viewable by authenticated users"
  on tasks for select
  to authenticated
  using (true);

create policy "authenticated users can create tasks"
  on tasks for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "authenticated users can update tasks"
  on tasks for update
  to authenticated
  using (true);

create policy "creators can delete their tasks"
  on tasks for delete
  to authenticated
  using (auth.uid() = created_by);

-- M3: rules, forms, portfolios.

-- rules -----------------------------------------------------------------
-- Evaluated in-app at mutation time (createTask / updateTaskStatus / updateTaskDetails)
-- rather than as separate Edge Functions, to avoid a second deployment surface
-- for a first version. trigger_value / action_value hold small JSON payloads,
-- e.g. trigger_value: {"status": "done"}, action_value: {"tag_id": "..."}.

create table rules (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  name text not null,
  enabled boolean not null default true,
  trigger_type text not null check (trigger_type in ('task_created', 'status_changed', 'assignee_changed')),
  trigger_value jsonb not null default '{}'::jsonb,
  action_type text not null check (action_type in ('set_status', 'set_assignee', 'add_tag', 'notify_assignee')),
  action_value jsonb not null default '{}'::jsonb,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now()
);

alter table rules enable row level security;

create policy "rules are viewable by authenticated users"
  on rules for select
  to authenticated
  using (true);

create policy "authenticated users can manage rules"
  on rules for all
  to authenticated
  using (true)
  with check (true);

-- forms -------------------------------------------------------------------
-- One intake form per project. Submitting it creates a task pre-filled from
-- the configured fields (still an authenticated internal member for now —
-- public unauthenticated intake is a later, separate security decision).

create table forms (
  project_id uuid primary key references projects (id) on delete cascade,
  description text,
  include_description boolean not null default true,
  include_due_date boolean not null default true,
  include_assignee boolean not null default false,
  custom_field_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table forms enable row level security;

create policy "forms are viewable by authenticated users"
  on forms for select
  to authenticated
  using (true);

create policy "authenticated users can manage forms"
  on forms for all
  to authenticated
  using (true)
  with check (true);

-- portfolios ----------------------------------------------------------------

create table portfolios (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now()
);

alter table portfolios enable row level security;

create policy "portfolios are viewable by authenticated users"
  on portfolios for select
  to authenticated
  using (true);

create policy "authenticated users can create portfolios"
  on portfolios for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "creators can delete their portfolios"
  on portfolios for delete
  to authenticated
  using (auth.uid() = created_by);

create table portfolio_projects (
  portfolio_id uuid not null references portfolios (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  primary key (portfolio_id, project_id)
);

alter table portfolio_projects enable row level security;

create policy "portfolio projects are viewable by authenticated users"
  on portfolio_projects for select
  to authenticated
  using (true);

create policy "authenticated users can manage portfolio projects"
  on portfolio_projects for all
  to authenticated
  using (true)
  with check (true);

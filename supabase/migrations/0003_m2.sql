-- M2: tags, dependencies, custom fields, notifications, timeline start date, realtime.

alter table tasks add column start_date date;

-- tags -----------------------------------------------------------------

create table tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default '#6b6b6b',
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now()
);

alter table tags enable row level security;

create policy "tags are viewable by authenticated users"
  on tags for select
  to authenticated
  using (true);

create policy "authenticated users can create tags"
  on tags for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "creators can delete their tags"
  on tags for delete
  to authenticated
  using (auth.uid() = created_by);

create table task_tags (
  task_id uuid not null references tasks (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  primary key (task_id, tag_id)
);

alter table task_tags enable row level security;

create policy "task tags are viewable by authenticated users"
  on task_tags for select
  to authenticated
  using (true);

create policy "authenticated users can tag tasks"
  on task_tags for insert
  to authenticated
  with check (true);

create policy "authenticated users can untag tasks"
  on task_tags for delete
  to authenticated
  using (true);

-- task dependencies -----------------------------------------------------

create table task_dependencies (
  task_id uuid not null references tasks (id) on delete cascade,
  depends_on_task_id uuid not null references tasks (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, depends_on_task_id),
  constraint no_self_dependency check (task_id <> depends_on_task_id)
);

alter table task_dependencies enable row level security;

create policy "dependencies are viewable by authenticated users"
  on task_dependencies for select
  to authenticated
  using (true);

create policy "authenticated users can add dependencies"
  on task_dependencies for insert
  to authenticated
  with check (true);

create policy "authenticated users can remove dependencies"
  on task_dependencies for delete
  to authenticated
  using (true);

-- custom fields -----------------------------------------------------------

create table custom_fields (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  name text not null,
  field_type text not null check (field_type in ('text', 'number', 'dropdown', 'date')),
  options jsonb,
  created_at timestamptz not null default now()
);

alter table custom_fields enable row level security;

create policy "custom fields are viewable by authenticated users"
  on custom_fields for select
  to authenticated
  using (true);

create policy "authenticated users can manage custom fields"
  on custom_fields for all
  to authenticated
  using (true)
  with check (true);

create table task_custom_field_values (
  task_id uuid not null references tasks (id) on delete cascade,
  custom_field_id uuid not null references custom_fields (id) on delete cascade,
  value text,
  primary key (task_id, custom_field_id)
);

alter table task_custom_field_values enable row level security;

create policy "custom field values are viewable by authenticated users"
  on task_custom_field_values for select
  to authenticated
  using (true);

create policy "authenticated users can set custom field values"
  on task_custom_field_values for all
  to authenticated
  using (true)
  with check (true);

-- notifications -----------------------------------------------------------

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  actor_id uuid references profiles (id),
  type text not null,
  task_id uuid references tasks (id) on delete cascade,
  project_id uuid references projects (id) on delete cascade,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

create policy "users can view their own notifications"
  on notifications for select
  to authenticated
  using (auth.uid() = user_id);

create policy "authenticated users can create notifications for others"
  on notifications for insert
  to authenticated
  with check (true);

create policy "users can mark their own notifications read"
  on notifications for update
  to authenticated
  using (auth.uid() = user_id);

-- realtime ------------------------------------------------------------------

alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table comments;
alter publication supabase_realtime add table notifications;

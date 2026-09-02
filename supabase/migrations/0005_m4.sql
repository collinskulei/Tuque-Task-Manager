-- M4: roles, per-project guest membership, time tracking, audit log.
--
-- Model: 'admin' and 'member' keep today's org-wide access (unchanged).
-- 'guest' is new and is scoped to only the projects listed in project_members —
-- guests can view + comment there, but cannot create/edit/delete anything,
-- and cannot see internal config (tags, custom fields, rules, forms, portfolios).

alter table profiles
  add column role text not null default 'member' check (role in ('admin', 'member', 'guest'));

update profiles set role = 'admin' where email = 'admin@iacentre.co.ke';

-- Non-admins cannot change any profile's role, including their own.
create or replace function prevent_role_self_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin') then
      raise exception 'Only admins can change roles';
    end if;
  end if;
  return new;
end;
$$;

create trigger enforce_role_change_permission
  before update on profiles
  for each row execute function prevent_role_self_escalation();

-- project_members ------------------------------------------------------

create table project_members (
  project_id uuid not null references projects (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

alter table project_members enable row level security;

create policy "membership is viewable by authenticated users"
  on project_members for select
  to authenticated
  using (true);

create policy "admins can manage project membership"
  on project_members for all
  to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

-- helper functions ------------------------------------------------------

create or replace function is_org_editor()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from profiles p where p.id = auth.uid() and p.role in ('admin', 'member')
  );
$$;

create or replace function can_view_project(pid uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select is_org_editor() or exists (
    select 1 from project_members pm where pm.project_id = pid and pm.user_id = auth.uid()
  );
$$;

create or replace function can_view_task(tid uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (select 1 from tasks t where t.id = tid and can_view_project(t.project_id));
$$;

-- projects ----------------------------------------------------------------

drop policy if exists "projects are viewable by authenticated users" on projects;
create policy "projects are viewable per membership"
  on projects for select
  to authenticated
  using (can_view_project(id));

drop policy if exists "authenticated users can create projects" on projects;
create policy "org editors can create projects"
  on projects for insert
  to authenticated
  with check (auth.uid() = created_by and is_org_editor());

-- tasks ---------------------------------------------------------------------

drop policy if exists "tasks are viewable by authenticated users" on tasks;
create policy "tasks are viewable per project membership"
  on tasks for select
  to authenticated
  using (can_view_project(project_id));

drop policy if exists "authenticated users can create tasks" on tasks;
create policy "org editors can create tasks"
  on tasks for insert
  to authenticated
  with check (auth.uid() = created_by and is_org_editor());

drop policy if exists "authenticated users can update tasks" on tasks;
create policy "org editors can update tasks"
  on tasks for update
  to authenticated
  using (is_org_editor());

-- comments ------------------------------------------------------------------

drop policy if exists "comments are viewable by authenticated users" on comments;
create policy "comments are viewable per task visibility"
  on comments for select
  to authenticated
  using (can_view_task(task_id));

drop policy if exists "authenticated users can create comments" on comments;
create policy "visible-task viewers can comment"
  on comments for insert
  to authenticated
  with check (auth.uid() = author_id and can_view_task(task_id));

-- attachments -----------------------------------------------------------------

drop policy if exists "attachment rows are viewable by authenticated users" on task_attachments;
create policy "attachment rows are viewable per task visibility"
  on task_attachments for select
  to authenticated
  using (can_view_task(task_id));

drop policy if exists "authenticated users can attach files" on task_attachments;
create policy "org editors can attach files"
  on task_attachments for insert
  to authenticated
  with check (auth.uid() = uploaded_by and is_org_editor());

-- tags ------------------------------------------------------------------------
-- Tag names/colors stay globally visible (low sensitivity, needed for the
-- picker); only creation is restricted.

drop policy if exists "authenticated users can create tags" on tags;
create policy "org editors can create tags"
  on tags for insert
  to authenticated
  with check (auth.uid() = created_by and is_org_editor());

-- task_tags, task_dependencies, custom_fields, task_custom_field_values -----
-- Internal workflow config/metadata — hidden from guests entirely, not just
-- read-scoped, to keep the guest surface to "the work itself."

drop policy if exists "task tags are viewable by authenticated users" on task_tags;
create policy "org editors can view task tags"
  on task_tags for select
  to authenticated
  using (is_org_editor());

drop policy if exists "authenticated users can tag tasks" on task_tags;
create policy "org editors can tag tasks"
  on task_tags for insert
  to authenticated
  with check (is_org_editor());

drop policy if exists "authenticated users can untag tasks" on task_tags;
create policy "org editors can untag tasks"
  on task_tags for delete
  to authenticated
  using (is_org_editor());

drop policy if exists "dependencies are viewable by authenticated users" on task_dependencies;
create policy "org editors can view dependencies"
  on task_dependencies for select
  to authenticated
  using (is_org_editor());

drop policy if exists "authenticated users can add dependencies" on task_dependencies;
create policy "org editors can add dependencies"
  on task_dependencies for insert
  to authenticated
  with check (is_org_editor());

drop policy if exists "authenticated users can remove dependencies" on task_dependencies;
create policy "org editors can remove dependencies"
  on task_dependencies for delete
  to authenticated
  using (is_org_editor());

drop policy if exists "custom fields are viewable by authenticated users" on custom_fields;
create policy "org editors can view custom fields"
  on custom_fields for select
  to authenticated
  using (is_org_editor());

drop policy if exists "authenticated users can manage custom fields" on custom_fields;
create policy "org editors can manage custom fields"
  on custom_fields for all
  to authenticated
  using (is_org_editor())
  with check (is_org_editor());

drop policy if exists "custom field values are viewable by authenticated users" on task_custom_field_values;
create policy "org editors can view custom field values"
  on task_custom_field_values for select
  to authenticated
  using (is_org_editor());

drop policy if exists "authenticated users can set custom field values" on task_custom_field_values;
create policy "org editors can set custom field values"
  on task_custom_field_values for all
  to authenticated
  using (is_org_editor())
  with check (is_org_editor());

-- rules, forms, portfolios, portfolio_projects -------------------------------

drop policy if exists "rules are viewable by authenticated users" on rules;
create policy "org editors can view rules"
  on rules for select
  to authenticated
  using (is_org_editor());

drop policy if exists "authenticated users can manage rules" on rules;
create policy "org editors can manage rules"
  on rules for all
  to authenticated
  using (is_org_editor())
  with check (is_org_editor());

drop policy if exists "forms are viewable by authenticated users" on forms;
create policy "org editors can view forms"
  on forms for select
  to authenticated
  using (is_org_editor());

drop policy if exists "authenticated users can manage forms" on forms;
create policy "org editors can manage forms"
  on forms for all
  to authenticated
  using (is_org_editor())
  with check (is_org_editor());

drop policy if exists "portfolios are viewable by authenticated users" on portfolios;
create policy "org editors can view portfolios"
  on portfolios for select
  to authenticated
  using (is_org_editor());

drop policy if exists "authenticated users can create portfolios" on portfolios;
create policy "org editors can create portfolios"
  on portfolios for insert
  to authenticated
  with check (auth.uid() = created_by and is_org_editor());

drop policy if exists "portfolio projects are viewable by authenticated users" on portfolio_projects;
create policy "org editors can view portfolio projects"
  on portfolio_projects for select
  to authenticated
  using (is_org_editor());

drop policy if exists "authenticated users can manage portfolio projects" on portfolio_projects;
create policy "org editors can manage portfolio projects"
  on portfolio_projects for all
  to authenticated
  using (is_org_editor())
  with check (is_org_editor());

-- time entries ----------------------------------------------------------------

create table time_entries (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks (id) on delete cascade,
  user_id uuid not null references profiles (id),
  hours numeric(5, 2) not null check (hours > 0),
  note text,
  entry_date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table time_entries enable row level security;

create policy "time entries are viewable per task visibility"
  on time_entries for select
  to authenticated
  using (can_view_task(task_id));

create policy "org editors can log their own time"
  on time_entries for insert
  to authenticated
  with check (auth.uid() = user_id and is_org_editor() and can_view_task(task_id));

create policy "users can delete their own time entries"
  on time_entries for delete
  to authenticated
  using (auth.uid() = user_id);

-- audit log ---------------------------------------------------------------

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles (id),
  action text not null,
  target_type text not null,
  target_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table audit_log enable row level security;

create policy "admins can view the audit log"
  on audit_log for select
  to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "authenticated users can write their own audit entries"
  on audit_log for insert
  to authenticated
  with check (auth.uid() = actor_id);

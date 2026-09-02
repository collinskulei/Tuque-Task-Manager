-- M1: subtasks, comments, attachments, and board-ordering support.
--0002_m1_tasks.sql
alter table tasks
  add column parent_task_id uuid references tasks (id) on delete cascade,
  add column position integer not null default 0;

-- comments -----------------------------------------------------------------

create table comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks (id) on delete cascade,
  author_id uuid not null references profiles (id),
  body text not null,
  created_at timestamptz not null default now()
);

alter table comments enable row level security;

create policy "comments are viewable by authenticated users"
  on comments for select
  to authenticated
  using (true);

create policy "authenticated users can create comments"
  on comments for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "authors can delete their comments"
  on comments for delete
  to authenticated
  using (auth.uid() = author_id);

-- attachments ----------------------------------------------------------------

create table task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks (id) on delete cascade,
  file_path text not null,
  file_name text not null,
  size bigint,
  uploaded_by uuid not null references profiles (id),
  created_at timestamptz not null default now()
);

alter table task_attachments enable row level security;

create policy "attachment rows are viewable by authenticated users"
  on task_attachments for select
  to authenticated
  using (true);

create policy "authenticated users can attach files"
  on task_attachments for insert
  to authenticated
  with check (auth.uid() = uploaded_by);

create policy "uploaders can delete their attachments"
  on task_attachments for delete
  to authenticated
  using (auth.uid() = uploaded_by);

-- storage bucket for attachment files ---------------------------------------

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy "authenticated users can read attachment files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'attachments');

create policy "authenticated users can upload attachment files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'attachments');

create policy "uploaders can delete their attachment files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'attachments' and owner = auth.uid());

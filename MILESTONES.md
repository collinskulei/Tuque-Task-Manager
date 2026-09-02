# Tuque Task Manager — Milestones

Stack: **Next.js on Vercel** (frontend + serverless/edge functions) + **Supabase** (Postgres, Auth, Realtime, Storage, RLS for permissions).
Design mandate: **minimalistic UI** at every milestone — no feature ships without a clean, uncluttered pass. See "Design principles" below; every milestone's exit criteria includes a UI review against them.

## Design principles (applies to all milestones)
- Neutral, restrained palette (1 accent color max); generous whitespace over borders/dividers
- Typography-led hierarchy — size/weight to organize, not color or boxes
- Progressive disclosure: show only what's needed for the current view; details on demand (drawers/modals), not permanent chrome
- Fast, keyboard-friendly interactions over decorative animation
- Every screen reviewed for "what can we remove" before it's marked done

---

## M0 — Foundation & Design System
Goal: empty but real, deployed skeleton.
- Next.js app scaffolded, deployed to Vercel (preview + prod pipelines)
- Supabase project: schema for `users`, `projects`, `tasks`; Supabase Auth wired (email + OAuth)
- Row-Level Security policies from day one (not bolted on later)
- Minimal design system: color tokens, type scale, spacing scale, base components (button, input, card, avatar) — small enough to hold in one file
- Exit criteria: authenticated user can log in and see an empty dashboard shell that already reflects the visual language

## M1 — MVP: Core Task Management
Goal: a usable single-player task tool.
- Tasks: create/edit/delete, owner, due date, status
- Subtasks, comments, file attachments (Supabase Storage)
- List view and Board (Kanban, drag-and-drop) view
- Basic free-text search
- Exit criteria: a team member can run their own work day entirely in List or Board view; UI reviewed for clutter (no unused columns/badges by default)

## M2 — Multi-user Organization
Goal: task manager becomes a team tool.
- Custom fields (text/number/dropdown/date)
- Task dependencies, tags
- Calendar view, Timeline/Gantt view
- Notifications + Inbox, "My Tasks" cross-project view
- Supabase Realtime for live board/list updates (no manual refresh)
- Exit criteria: two users editing the same board see updates live; new views don't add persistent UI weight to views that don't use them

## M3 — Automation & Structure
Goal: reduce manual coordination work.
- Rules (trigger → action) via Supabase Edge Functions
- Forms (intake → auto-created task)
- Portfolios (project-of-projects) with status rollups
- Basic reporting/dashboards (task counts, burn-up, simple charts)
- Exit criteria: a rule can be created without reading documentation; dashboard is legible at a glance, no chart clutter

## M4 — Resourcing & Admin
Goal: scale to org-wide use.
- Workload view (per-person load across projects) and simple capacity planning
- Time tracking (entries, basic budget/hours)
- Role-based permissions (admin/member/guest) enforced via Supabase RLS, not client-side checks
- Admin panel: user/role management, audit log
- Public API (Vercel serverless routes) for external integrations
- Exit criteria: an admin can manage roles and see an audit trail; a manager can spot over-allocation in under 10 seconds

## M5 — Claude / MCP Integration
Goal: expose the tool to Claude instead of building a chat UI.
- Remote MCP server (Streamable HTTP) hosted on Vercel, OAuth-gated per user
- Read tools first: `list_my_tasks`, `get_project_board`, `get_task_detail`, `search_tasks`
- Write tools once permissioning is proven solid: `assign_task`, `create_task`, `update_task_status`, `bulk_reassign` — enforced server-side against the same RLS/role rules as the app
- Audit log entries tagged with "via Claude" for traceability
- Exit criteria: a team member adds the connector in Claude and can query/act on their real board with correct permission boundaries

---

## Sequencing notes
- Design system (M0) is not optional scaffolding — every later milestone is UI review-gated against it, not just feature-gated.
- Supabase RLS policies are established per-table as each milestone introduces it, not retrofitted at M4.
- MCP (M5) deliberately comes last: write-tool safety depends on the role/permission system from M4 already being correct.

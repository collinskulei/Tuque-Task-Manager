# Asana Feature Reference (for internal task manager build)

## 1. Core Task Management
- Create, assign, and track tasks with owners and due dates
- Subtasks (break a task into smaller pieces)
- Task dependencies — mark a task as "waiting on" another task
- A single task can belong to **multiple projects at once** (up to 20), with updates syncing across all instances
- Custom fields (text, number, dropdown, date, etc.) to track budgets, hours, priority, and other structured data
- Task comments / in-context commenting, @mentions, file attachments
- Recurring tasks, start/due dates, priority flags
- Import tasks via CSV; export projects as CSV or JSON

## 2. Project Views
Multiple ways to visualize the same underlying work:
- **List view** — spreadsheet-style, structured task list
- **Board view** — Kanban-style, drag-and-drop columns for workflow stages
- **Calendar view** — see tasks by date
- **Timeline / Gantt view** — plan schedules and dependencies visually

## 3. Project & Portfolio Structure
- **Projects** — a container of tasks with its own views, fields, and rules
- **Portfolios** — a "project of projects," for monitoring multiple projects together with status/health rollups
- **Goals** — link team/project work to company-level objectives and track progress
- Milestones within a project timeline
- Project templates (including custom templates on paid tiers)
- Guest access — invite external collaborators to specific projects only

## 4. Collaboration
- Comments and threaded discussion on tasks
- @mentions and notifications
- File sharing/attachments (with per-file size limits)
- Status updates — periodic project/portfolio health summaries, with templates
- Inbox — centralized feed of updates relevant to you
- "My Tasks" — personal cross-project task list
- Home dashboard — overview of tasks, goals, and projects at a glance

## 5. Workflow Automation
- **Rules** — trigger → action automations (e.g., when a field changes, auto-assign, move task, notify someone, update a custom field)
- Rule builder with support for more complex/branching logic
- Rule duplication (clone a working rule instead of rebuilding it)
- Scheduled rules (time-based triggers, not just event-based)
- Forms — intake requests that auto-create tasks with pre-filled fields (routes work into a workflow)
- **AI Studio** — no-code builder for AI-assisted automations layered on top of rules

## 6. Reporting & Dashboards
- Real-time progress tracking (automatic project reporting, not manual status decks)
- Customizable charts (bar, donut, burn-up) tied to task/custom-field data
- Cross-project/portfolio dashboards for leadership visibility
- Shareable PDF reports for external stakeholders
- Clickable data points that drill into the underlying tasks

## 7. Resource & Capacity Management
- **Workload view** — see each person's task load across projects to spot over/under-allocation
- **Capacity planning** — slice team capacity by project type, priority, department, etc.
- Time tracking (native "Timesheets" add-on: time entries, budget/cost tracking, billable rates, approvals)

## 8. Search & Organization
- Advanced search / saved searches across tasks and projects
- Tags for cross-cutting categorization independent of project structure
- Teams (groups of users) as an organizational layer above projects

## 9. Admin & Security
- Role-based permissions (admin, member, guest)
- Org-wide user management (bulk role/access updates, saved admin views)
- Data export and audit controls (higher tiers)
- SSO / enterprise security controls (Enterprise tier)

## 10. Integrations & API
- Public REST API for building custom integrations
- Native integrations (Slack, Gmail, Jira — including two-way comment sync, and others)
- Webhooks for connecting to external systems

## 11. AI Features ("Asana Intelligence")
Useful to know about, optional to clone:
- Smart Editor — AI writing assistance inside task/brief descriptions
- Smart Summaries — auto-generated status/project summaries
- Smart Fields / Smart Rule Creator — AI-assisted setup of automations
- AI Teammates — role-based AI agents that operate inside workflows (e.g., a "Workflow Optimizer" agent)
- Smart Chat — conversational interface for querying/acting on work data

## 12. Feature Availability by Tier (for scoping your MVP)
Based on Asana's current plan structure:
- **Personal (free)**: tasks, projects, owners/due dates, core views (list/board/calendar)
- **Starter**: + Timeline/Gantt, custom fields, forms, rules, custom templates
- **Advanced/Enterprise**: + portfolios, goals, dashboards, workload/capacity planning, budget management, advanced admin controls

## 13. Claude Integration (via MCP)

Rather than building a chatbot inside the task manager, expose the tool's data and actions as a **remote MCP server** (Model Context Protocol). Team members then add it to Claude as a custom connector, and can ask Claude about their board or have it take action — no separate chat UI to build.

```
Team member's Claude (web/desktop/Code)
        │  "what does my board look like?"
        ▼
   Your MCP Server (you build this)
        │  translates the request into tool calls
        ▼
   Your task manager's database/API
```

### Architecture notes
- **Transport**: Streamable HTTP (current standard; SSE is being phased out)
- **Auth**: OAuth so each person only sees/acts on their own data — never trust the model to self-police permissions
- **Hosting**: any HTTPS-reachable service (Cloudflare Workers is a common lightweight choice)
- **Response size**: keep tool responses compact and structured; paginate large boards (custom connectors have roughly a 30K token response limit)

### Read tools (reporting)
| Tool | What it does |
|---|---|
| `list_my_tasks` | Tasks assigned to the current user, filterable by status/due date |
| `get_project_board` | Full board state for a project (columns/tasks/assignees) |
| `get_task_detail` | Single task with comments, subtasks, dependencies |
| `search_tasks` | Free-text search across tasks/projects |

### Write tools (managers assigning/updating work)
| Tool | Effect |
|---|---|
| `assign_task(task_id, assignee_id)` | Reassign an existing task |
| `create_task(project_id, title, assignee_id?, due_date?)` | New task, optionally pre-assigned |
| `update_task_status(task_id, status)` | Move a task across board columns |
| `bulk_reassign(from_user_id, to_user_id, project_id?)` | Reassign a person's open tasks to someone else |

### Design requirements for write access
- **Permission scoping**: enforce the same role rules as the web app server-side (e.g., a manager can only assign within projects they manage) — don't rely on Claude to police this
- **Confirmation before action**: Claude's clients naturally confirm before executing a send/create/modify action, so write tool descriptions should surface enough detail (task name, assignee, due date) for a clear confirmation prompt
- **Audit trail**: log who performed each write and that it originated via Claude, since actions now happen outside the normal UI
- **Access tiering decision**: decide upfront whether all team members get write access or only managers, and gate it by the authenticated user's role on every write call

### Rollout
- Each team member: **Claude → Customize > Connectors > Add custom connector**, paste the server URL, authenticate via OAuth
- On Team/Enterprise Claude plans, an admin can add it once org-wide so members don't self-configure
- Optional extensions: **Claude Tag** (Slack) to reuse the same MCP server for `@Claude` mentions; embedding the Claude API directly in-app only if you want a chat panel inside the tool's own UI (duplicates what MCP already gives you)

---

### Suggested build priority for an internal clone
1. **MVP**: tasks, subtasks, assignees, due dates, comments, list + board views, basic search
2. **V2**: custom fields, dependencies, tags, calendar/timeline view, notifications/inbox
3. **V3**: rules/automation, forms, portfolios, basic reporting/dashboards
4. **V4**: workload/capacity, time tracking, admin roles, API/integrations
5. **V5**: Claude/MCP integration — read tools first (reporting), write tools once permissioning is solid

Sources: Asana's official feature pages and 2026 release notes (Winter/Spring 2026), plus independent product reviews (Everhour, Cirface, FireBear, StarAgile) current as of mid-2026.

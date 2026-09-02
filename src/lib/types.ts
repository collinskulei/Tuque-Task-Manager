export type TaskStatus = "todo" | "in_progress" | "done";

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export type CustomFieldType = "text" | "number" | "dropdown" | "date";
export type UserRole = "admin" | "member" | "guest";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
}

export interface Project {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface Attachment {
  id: string;
  task_id: string;
  file_path: string;
  file_name: string;
  size: number | null;
  uploaded_by: string;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_by: string;
  created_at: string;
}

export interface CustomField {
  id: string;
  project_id: string;
  name: string;
  field_type: CustomFieldType;
  options: string[] | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  task_id: string | null;
  project_id: string | null;
  message: string;
  read: boolean;
  created_at: string;
}

export type RuleTriggerType = "task_created" | "status_changed" | "assignee_changed";
export type RuleActionType = "set_status" | "set_assignee" | "add_tag" | "notify_assignee";

export interface Rule {
  id: string;
  project_id: string;
  name: string;
  enabled: boolean;
  trigger_type: RuleTriggerType;
  trigger_value: Record<string, string>;
  action_type: RuleActionType;
  action_value: Record<string, string>;
  created_by: string;
  created_at: string;
}

export interface ProjectForm {
  project_id: string;
  description: string | null;
  include_description: boolean;
  include_due_date: boolean;
  include_assignee: boolean;
  custom_field_ids: string[];
  created_at: string;
}

export interface Portfolio {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface PortfolioProjectRollup {
  project: Project;
  totalTasks: number;
  doneTasks: number;
}

export interface TimeEntry {
  id: string;
  task_id: string;
  user_id: string;
  hours: number;
  note: string | null;
  entry_date: string;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  added_at: string;
}

export interface WorkloadRow {
  profile: Profile;
  openTaskCount: number;
}

export interface Task {
  id: string;
  project_id: string;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignee_id: string | null;
  due_date: string | null;
  start_date: string | null;
  created_by: string;
  position: number;
  created_at: string;
  updated_at: string;
  subtasks: Task[];
  comments: Comment[];
  attachments: Attachment[];
  tagIds: string[];
  dependsOnIds: string[];
  customFieldValues: Record<string, string>;
  timeEntries: TimeEntry[];
}

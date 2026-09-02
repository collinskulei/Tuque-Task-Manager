export type TaskStatus = "todo" | "in_progress" | "done";

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export type CustomFieldType = "text" | "number" | "dropdown" | "date";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
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
}

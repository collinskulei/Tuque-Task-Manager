import { createClient } from "@/lib/supabase/server";
import type { Attachment, Comment, Profile, Project, Task } from "@/lib/types";

function assembleTasks(
  rows: Omit<Task, "subtasks" | "comments" | "attachments">[],
  comments: Comment[],
  attachments: Attachment[]
): Task[] {
  const byId = new Map<string, Task>();
  for (const row of rows) {
    byId.set(row.id, { ...row, subtasks: [], comments: [], attachments: [] });
  }

  for (const comment of comments) {
    byId.get(comment.task_id)?.comments.push(comment);
  }
  for (const attachment of attachments) {
    byId.get(attachment.task_id)?.attachments.push(attachment);
  }

  const topLevel: Task[] = [];
  for (const task of byId.values()) {
    if (task.parent_task_id) {
      byId.get(task.parent_task_id)?.subtasks.push(task);
    } else {
      topLevel.push(task);
    }
  }

  return topLevel;
}

async function loadTaskGraph(taskRows: Omit<Task, "subtasks" | "comments" | "attachments">[]) {
  const supabase = await createClient();
  const taskIds = taskRows.map((t) => t.id);

  if (taskIds.length === 0) return assembleTasks(taskRows, [], []);

  const [{ data: comments }, { data: attachments }] = await Promise.all([
    supabase
      .from("comments")
      .select("*")
      .in("task_id", taskIds)
      .order("created_at", { ascending: true }),
    supabase
      .from("task_attachments")
      .select("*")
      .in("task_id", taskIds)
      .order("created_at", { ascending: true }),
  ]);

  return assembleTasks(taskRows, comments ?? [], attachments ?? []);
}

export async function getProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .order("email", { ascending: true });
  return data ?? [];
}

export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function getProject(projectId: string): Promise<Project | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();
  return data;
}

export async function getProjectTasks(projectId: string): Promise<Task[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  return loadTaskGraph(data ?? []);
}

export async function getMyTasks(userId: string): Promise<Task[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("assignee_id", userId)
    .is("parent_task_id", null)
    .order("due_date", { ascending: true, nullsFirst: false });

  return loadTaskGraph(data ?? []);
}

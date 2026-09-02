import { createClient } from "@/lib/supabase/server";
import type {
  Attachment,
  AuditLogEntry,
  Comment,
  CustomField,
  Notification,
  Portfolio,
  PortfolioProjectRollup,
  Profile,
  Project,
  ProjectForm,
  ProjectMember,
  Rule,
  Tag,
  Task,
  TimeEntry,
  WorkloadRow,
} from "@/lib/types";

type RawTask = Omit<
  Task,
  "subtasks" | "comments" | "attachments" | "tagIds" | "dependsOnIds" | "customFieldValues" | "timeEntries"
>;

function assembleTasks(
  rows: RawTask[],
  comments: Comment[],
  attachments: Attachment[],
  taskTags: { task_id: string; tag_id: string }[],
  dependencies: { task_id: string; depends_on_task_id: string }[],
  fieldValues: { task_id: string; custom_field_id: string; value: string | null }[],
  timeEntries: TimeEntry[]
): Task[] {
  const byId = new Map<string, Task>();
  for (const row of rows) {
    byId.set(row.id, {
      ...row,
      subtasks: [],
      comments: [],
      attachments: [],
      tagIds: [],
      dependsOnIds: [],
      customFieldValues: {},
      timeEntries: [],
    });
  }

  for (const comment of comments) {
    byId.get(comment.task_id)?.comments.push(comment);
  }
  for (const attachment of attachments) {
    byId.get(attachment.task_id)?.attachments.push(attachment);
  }
  for (const tt of taskTags) {
    byId.get(tt.task_id)?.tagIds.push(tt.tag_id);
  }
  for (const dep of dependencies) {
    byId.get(dep.task_id)?.dependsOnIds.push(dep.depends_on_task_id);
  }
  for (const fv of fieldValues) {
    const task = byId.get(fv.task_id);
    if (task && fv.value !== null) task.customFieldValues[fv.custom_field_id] = fv.value;
  }
  for (const entry of timeEntries) {
    byId.get(entry.task_id)?.timeEntries.push(entry);
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

async function loadTaskGraph(taskRows: RawTask[]) {
  const supabase = await createClient();
  const taskIds = taskRows.map((t) => t.id);

  if (taskIds.length === 0) return assembleTasks(taskRows, [], [], [], [], [], []);

  const [
    { data: comments },
    { data: attachments },
    { data: taskTags },
    { data: dependencies },
    { data: fieldValues },
    { data: timeEntries },
  ] = await Promise.all([
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
    supabase.from("task_tags").select("task_id, tag_id").in("task_id", taskIds),
    supabase
      .from("task_dependencies")
      .select("task_id, depends_on_task_id")
      .in("task_id", taskIds),
    supabase
      .from("task_custom_field_values")
      .select("task_id, custom_field_id, value")
      .in("task_id", taskIds),
    supabase
      .from("time_entries")
      .select("*")
      .in("task_id", taskIds)
      .order("entry_date", { ascending: false }),
  ]);

  return assembleTasks(
    taskRows,
    comments ?? [],
    attachments ?? [],
    taskTags ?? [],
    dependencies ?? [],
    fieldValues ?? [],
    timeEntries ?? []
  );
}

export async function getProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .order("email", { ascending: true });
  return data ?? [];
}

export async function getMyProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", userId)
    .single();
  return data;
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

export async function getTags(): Promise<Tag[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("tags").select("*").order("name", { ascending: true });
  return data ?? [];
}

export async function getProjectCustomFields(projectId: string): Promise<CustomField[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("custom_fields")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);
  return count ?? 0;
}

export async function getProjectRules(projectId: string): Promise<Rule[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rules")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function getProjectForm(projectId: string): Promise<ProjectForm | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("forms")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();
  return data;
}

export async function getPortfolios(): Promise<Portfolio[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("portfolios")
    .select("*")
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function getPortfolio(portfolioId: string): Promise<Portfolio | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("portfolios")
    .select("*")
    .eq("id", portfolioId)
    .single();
  return data;
}

export async function getPortfolioRollups(portfolioId: string): Promise<PortfolioProjectRollup[]> {
  const supabase = await createClient();
  const { data: links } = await supabase
    .from("portfolio_projects")
    .select("project_id")
    .eq("portfolio_id", portfolioId);

  const projectIds = (links ?? []).map((l) => l.project_id);
  if (projectIds.length === 0) return [];

  const [{ data: projects }, { data: tasks }] = await Promise.all([
    supabase.from("projects").select("*").in("id", projectIds),
    supabase.from("tasks").select("project_id, status").in("project_id", projectIds).is("parent_task_id", null),
  ]);

  return (projects ?? []).map((project) => {
    const projectTasks = (tasks ?? []).filter((t) => t.project_id === project.id);
    return {
      project,
      totalTasks: projectTasks.length,
      doneTasks: projectTasks.filter((t) => t.status === "done").length,
    };
  });
}

export async function getProjectTaskCounts(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tasks")
    .select("status")
    .eq("project_id", projectId);

  const rows = data ?? [];
  return {
    todo: rows.filter((r) => r.status === "todo").length,
    in_progress: rows.filter((r) => r.status === "in_progress").length,
    done: rows.filter((r) => r.status === "done").length,
    total: rows.length,
  };
}

export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_members")
    .select("*")
    .eq("project_id", projectId);
  return data ?? [];
}

export async function getAllProjectMembers(): Promise<ProjectMember[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("project_members").select("*");
  return data ?? [];
}

export async function getWorkload(): Promise<WorkloadRow[]> {
  const supabase = await createClient();
  const [{ data: profiles }, { data: tasks }] = await Promise.all([
    supabase.from("profiles").select("id, email, full_name, role"),
    supabase
      .from("tasks")
      .select("assignee_id, status")
      .in("status", ["todo", "in_progress"])
      .not("assignee_id", "is", null),
  ]);

  return (profiles ?? [])
    .filter((p) => p.role !== "guest")
    .map((profile) => ({
      profile,
      openTaskCount: (tasks ?? []).filter((t) => t.assignee_id === profile.id).length,
    }))
    .sort((a, b) => b.openTaskCount - a.openTaskCount);
}

export async function getAuditLog(): Promise<AuditLogEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

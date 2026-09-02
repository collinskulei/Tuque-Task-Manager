"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  CustomFieldType,
  RuleActionType,
  RuleTriggerType,
  TaskStatus,
} from "@/lib/types";

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

async function notify(input: {
  userId: string;
  actorId: string;
  type: string;
  message: string;
  taskId?: string;
  projectId?: string;
  system?: boolean;
}) {
  if (!input.system && input.userId === input.actorId) return;
  const supabase = await createClient();
  await supabase.from("notifications").insert({
    user_id: input.userId,
    actor_id: input.actorId,
    type: input.type,
    message: input.message,
    task_id: input.taskId ?? null,
    project_id: input.projectId ?? null,
  });
}

async function runRules(
  projectId: string,
  taskId: string,
  triggerType: RuleTriggerType,
  context: { status?: TaskStatus; assigneeId?: string | null }
) {
  const supabase = await createClient();
  const { data: rules } = await supabase
    .from("rules")
    .select("*")
    .eq("project_id", projectId)
    .eq("trigger_type", triggerType)
    .eq("enabled", true);

  for (const rule of rules ?? []) {
    const tv = rule.trigger_value ?? {};
    if (triggerType === "status_changed" && tv.status && tv.status !== context.status) continue;
    if (
      triggerType === "assignee_changed" &&
      tv.assignee_id &&
      tv.assignee_id !== (context.assigneeId ?? "")
    )
      continue;

    const av = rule.action_value ?? {};
    if (rule.action_type === "set_status" && av.status) {
      await supabase
        .from("tasks")
        .update({ status: av.status, updated_at: new Date().toISOString() })
        .eq("id", taskId);
    } else if (rule.action_type === "set_assignee" && av.assignee_id) {
      await supabase.from("tasks").update({ assignee_id: av.assignee_id }).eq("id", taskId);
    } else if (rule.action_type === "add_tag" && av.tag_id) {
      await supabase
        .from("task_tags")
        .upsert(
          { task_id: taskId, tag_id: av.tag_id },
          { onConflict: "task_id,tag_id", ignoreDuplicates: true }
        );
    } else if (rule.action_type === "notify_assignee") {
      const { data: task } = await supabase
        .from("tasks")
        .select("assignee_id, title")
        .eq("id", taskId)
        .single();
      if (task?.assignee_id) {
        await notify({
          userId: task.assignee_id,
          actorId: task.assignee_id,
          system: true,
          type: "rule",
          message: av.message || `Rule "${rule.name}" triggered on "${task.title}"`,
          taskId,
          projectId,
        });
      }
    }
  }
}

export async function createProject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const userId = await requireUserId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({ name, created_by: userId })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create project");

  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/projects/${data.id}`);
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}

export async function createTask(input: {
  projectId: string;
  title: string;
  parentTaskId?: string | null;
}) {
  const title = input.title.trim();
  if (!title) return;

  const userId = await requireUserId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: input.projectId,
      parent_task_id: input.parentTaskId ?? null,
      title,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  if (!input.parentTaskId) {
    await runRules(input.projectId, data.id, "task_created", {});
  }

  revalidatePath(`/dashboard/projects/${input.projectId}`);
  revalidatePath("/dashboard");
}

export async function updateTaskStatus(
  taskId: string,
  projectId: string,
  status: TaskStatus
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) throw new Error(error.message);

  await runRules(projectId, taskId, "status_changed", { status });

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard");
}

export async function updateTaskDetails(input: {
  taskId: string;
  projectId: string;
  title: string;
  description: string;
  assigneeId: string | null;
  dueDate: string | null;
  startDate?: string | null;
}) {
  const title = input.title.trim();
  if (!title) return;

  const userId = await requireUserId();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("tasks")
    .select("assignee_id")
    .eq("id", input.taskId)
    .single();

  const { error } = await supabase
    .from("tasks")
    .update({
      title,
      description: input.description || null,
      assignee_id: input.assigneeId,
      due_date: input.dueDate,
      ...(input.startDate !== undefined ? { start_date: input.startDate } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.taskId);

  if (error) throw new Error(error.message);

  if (input.assigneeId !== existing?.assignee_id) {
    if (input.assigneeId) {
      await notify({
        userId: input.assigneeId,
        actorId: userId,
        type: "assigned",
        message: `You were assigned to "${title}"`,
        taskId: input.taskId,
        projectId: input.projectId,
      });
    }
    await runRules(input.projectId, input.taskId, "assignee_changed", {
      assigneeId: input.assigneeId,
    });
  }

  revalidatePath(`/dashboard/projects/${input.projectId}`);
  revalidatePath("/dashboard");
}

export async function deleteTask(taskId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard");
}

export async function addComment(input: {
  taskId: string;
  projectId: string;
  body: string;
}) {
  const body = input.body.trim();
  if (!body) return;

  const userId = await requireUserId();
  const supabase = await createClient();
  const { error } = await supabase
    .from("comments")
    .insert({ task_id: input.taskId, author_id: userId, body });

  if (error) throw new Error(error.message);

  const { data: task } = await supabase
    .from("tasks")
    .select("title, assignee_id, created_by")
    .eq("id", input.taskId)
    .single();

  if (task) {
    const recipients = new Set([task.assignee_id, task.created_by].filter(Boolean) as string[]);
    for (const recipientId of recipients) {
      await notify({
        userId: recipientId,
        actorId: userId,
        type: "comment",
        message: `New comment on "${task.title}"`,
        taskId: input.taskId,
        projectId: input.projectId,
      });
    }
  }

  revalidatePath(`/dashboard/projects/${input.projectId}`);
}

export async function deleteComment(commentId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function uploadAttachment(formData: FormData) {
  const taskId = String(formData.get("taskId"));
  const projectId = String(formData.get("projectId"));
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return;

  const userId = await requireUserId();
  const supabase = await createClient();
  const filePath = `${taskId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(filePath, file);
  if (uploadError) throw new Error(uploadError.message);

  const { error } = await supabase.from("task_attachments").insert({
    task_id: taskId,
    file_path: filePath,
    file_name: file.name,
    size: file.size,
    uploaded_by: userId,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function deleteAttachment(
  attachmentId: string,
  filePath: string,
  projectId: string
) {
  const supabase = await createClient();
  await supabase.storage.from("attachments").remove([filePath]);
  const { error } = await supabase
    .from("task_attachments")
    .delete()
    .eq("id", attachmentId);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function getAttachmentUrl(filePath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("attachments")
    .createSignedUrl(filePath, 60);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

// tags ------------------------------------------------------------------

export async function createTag(name: string, color: string) {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const userId = await requireUserId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tags")
    .insert({ name: trimmed, color, created_by: userId })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard", "layout");
  return data.id as string;
}

export async function createTagAndApply(
  name: string,
  color: string,
  taskId: string,
  projectId: string
) {
  const trimmed = name.trim();
  if (!trimmed) return;

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("tags")
    .select("id")
    .ilike("name", trimmed)
    .maybeSingle();

  const tagId = existing?.id ?? (await createTag(trimmed, color));
  if (!tagId) return;
  await addTagToTask(taskId, tagId, projectId);
}

export async function addTagToTask(taskId: string, tagId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("task_tags").insert({ task_id: taskId, tag_id: tagId });
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard");
}

export async function removeTagFromTask(taskId: string, tagId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("task_tags")
    .delete()
    .eq("task_id", taskId)
    .eq("tag_id", tagId);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard");
}

// dependencies ------------------------------------------------------------

export async function addDependency(
  taskId: string,
  dependsOnTaskId: string,
  projectId: string
) {
  if (taskId === dependsOnTaskId) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("task_dependencies")
    .insert({ task_id: taskId, depends_on_task_id: dependsOnTaskId });
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function removeDependency(
  taskId: string,
  dependsOnTaskId: string,
  projectId: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("task_dependencies")
    .delete()
    .eq("task_id", taskId)
    .eq("depends_on_task_id", dependsOnTaskId);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/projects/${projectId}`);
}

// custom fields -------------------------------------------------------------

export async function createCustomField(input: {
  projectId: string;
  name: string;
  fieldType: CustomFieldType;
  options?: string[];
}) {
  const name = input.name.trim();
  if (!name) return;

  const supabase = await createClient();
  const { error } = await supabase.from("custom_fields").insert({
    project_id: input.projectId,
    name,
    field_type: input.fieldType,
    options: input.fieldType === "dropdown" ? input.options ?? [] : null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/projects/${input.projectId}`);
}

export async function deleteCustomField(fieldId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("custom_fields").delete().eq("id", fieldId);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function setCustomFieldValue(
  taskId: string,
  customFieldId: string,
  value: string,
  projectId: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("task_custom_field_values")
    .upsert({ task_id: taskId, custom_field_id: customFieldId, value });
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/projects/${projectId}`);
}

// notifications -------------------------------------------------------------

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient();
  await supabase.from("notifications").update({ read: true }).eq("id", notificationId);
  revalidatePath("/dashboard", "layout");
}

export async function markAllNotificationsRead() {
  const userId = await requireUserId();
  const supabase = await createClient();
  await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  revalidatePath("/dashboard", "layout");
}

// rules -----------------------------------------------------------------

export async function createRule(input: {
  projectId: string;
  name: string;
  triggerType: RuleTriggerType;
  triggerValue: Record<string, string>;
  actionType: RuleActionType;
  actionValue: Record<string, string>;
}) {
  const userId = await requireUserId();
  const supabase = await createClient();
  const { error } = await supabase.from("rules").insert({
    project_id: input.projectId,
    name: input.name,
    trigger_type: input.triggerType,
    trigger_value: input.triggerValue,
    action_type: input.actionType,
    action_value: input.actionValue,
    created_by: userId,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/projects/${input.projectId}`);
}

export async function toggleRule(ruleId: string, enabled: boolean, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("rules").update({ enabled }).eq("id", ruleId);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function deleteRule(ruleId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("rules").delete().eq("id", ruleId);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/projects/${projectId}`);
}

// forms -------------------------------------------------------------------

export async function saveForm(input: {
  projectId: string;
  description: string;
  includeDescription: boolean;
  includeDueDate: boolean;
  includeAssignee: boolean;
  customFieldIds: string[];
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("forms").upsert({
    project_id: input.projectId,
    description: input.description || null,
    include_description: input.includeDescription,
    include_due_date: input.includeDueDate,
    include_assignee: input.includeAssignee,
    custom_field_ids: input.customFieldIds,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/projects/${input.projectId}/intake`);
  revalidatePath(`/dashboard/projects/${input.projectId}`);
}

export async function submitForm(formData: FormData) {
  const projectId = String(formData.get("projectId"));
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const userId = await requireUserId();
  const supabase = await createClient();

  const description = formData.get("description");
  const dueDate = formData.get("dueDate");
  const assigneeId = formData.get("assigneeId");

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      title,
      created_by: userId,
      description: description ? String(description) : null,
      due_date: dueDate ? String(dueDate) : null,
      assignee_id: assigneeId ? String(assigneeId) : null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  for (const [key, value] of formData.entries()) {
    if (key.startsWith("field_") && String(value).trim()) {
      const customFieldId = key.replace("field_", "");
      await supabase
        .from("task_custom_field_values")
        .upsert({ task_id: data.id, custom_field_id: customFieldId, value: String(value) });
    }
  }

  await runRules(projectId, data.id, "task_created", {});

  revalidatePath(`/dashboard/projects/${projectId}`);
  redirect(`/dashboard/projects/${projectId}/intake?submitted=1`);
}

// portfolios ----------------------------------------------------------------

export async function createPortfolio(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const userId = await requireUserId();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("portfolios")
    .insert({ name, created_by: userId })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create portfolio");

  revalidatePath("/dashboard", "layout");
  redirect(`/dashboard/portfolios/${data.id}`);
}

export async function deletePortfolio(portfolioId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("portfolios").delete().eq("id", portfolioId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}

export async function addProjectToPortfolio(portfolioId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("portfolio_projects")
    .upsert(
      { portfolio_id: portfolioId, project_id: projectId },
      { onConflict: "portfolio_id,project_id", ignoreDuplicates: true }
    );
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/portfolios/${portfolioId}`);
}

export async function removeProjectFromPortfolio(portfolioId: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("portfolio_projects")
    .delete()
    .eq("portfolio_id", portfolioId)
    .eq("project_id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath(`/dashboard/portfolios/${portfolioId}`);
}

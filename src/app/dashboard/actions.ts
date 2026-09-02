"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TaskStatus } from "@/lib/types";

async function requireUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
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
  const { error } = await supabase.from("tasks").insert({
    project_id: input.projectId,
    parent_task_id: input.parentTaskId ?? null,
    title,
    created_by: userId,
  });

  if (error) throw new Error(error.message);
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
}) {
  const title = input.title.trim();
  if (!title) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      title,
      description: input.description || null,
      assignee_id: input.assigneeId,
      due_date: input.dueDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.taskId);

  if (error) throw new Error(error.message);
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

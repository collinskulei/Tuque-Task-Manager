"use client";

import { useState } from "react";
import {
  addComment,
  createTask,
  deleteAttachment,
  deleteComment,
  deleteTask,
  getAttachmentUrl,
  updateTaskDetails,
  updateTaskStatus,
  uploadAttachment,
} from "@/app/dashboard/actions";
import type { Profile, Task, TaskStatus } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusSelect } from "@/components/tasks/status-select";
import { useServerAction } from "@/lib/use-server-action";
import { formatFileSize } from "@/lib/utils";

export function TaskDetail({
  task,
  profiles,
  currentUserId,
  onClose,
}: {
  task: Task;
  profiles: Profile[];
  currentUserId: string;
  onClose: () => void;
}) {
  const projectId = task.project_id;
  const { run } = useServerAction();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [assigneeId, setAssigneeId] = useState(task.assignee_id ?? "");
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  function save() {
    run(() =>
      updateTaskDetails({
        taskId: task.id,
        projectId,
        title,
        description,
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
      })
    );
  }

  function handleStatusChange(status: TaskStatus) {
    run(() => updateTaskStatus(task.id, projectId, status));
  }

  function handleAddSubtask() {
    if (!newSubtask.trim()) return;
    run(() =>
      createTask({ projectId, title: newSubtask, parentTaskId: task.id })
    );
    setNewSubtask("");
  }

  function handleAddComment() {
    if (!newComment.trim()) return;
    run(() => addComment({ taskId: task.id, projectId, body: newComment }));
    setNewComment("");
  }

  async function handleDownload(filePath: string) {
    const url = await getAttachmentUrl(filePath);
    window.open(url, "_blank");
  }

  function handleDeleteTask() {
    run(() => deleteTask(task.id, projectId));
    onClose();
  }

  return (
    <div className="fixed inset-0 z-10 flex justify-end bg-black/20" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-surface p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <StatusSelect value={task.status} onChange={handleStatusChange} />
          <button
            onClick={onClose}
            className="text-sm text-foreground-subtle hover:text-foreground"
          >
            Close
          </button>
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={save}
          className="mb-3 w-full text-lg font-medium outline-none"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={save}
          placeholder="Add a description..."
          rows={3}
          className="mb-4 w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-foreground-subtle focus:border-accent"
        />

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-foreground-subtle">Assignee</label>
            <select
              value={assigneeId}
              onChange={(e) => {
                setAssigneeId(e.target.value);
                run(() =>
                  updateTaskDetails({
                    taskId: task.id,
                    projectId,
                    title,
                    description,
                    assigneeId: e.target.value || null,
                    dueDate: dueDate || null,
                  })
                );
              }}
              className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-accent"
            >
              <option value="">Unassigned</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name || p.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-foreground-subtle">Due date</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              onBlur={save}
              className="text-sm"
            />
          </div>
        </div>

        <section className="mb-6">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-subtle">
            Subtasks
          </h3>
          <div className="flex flex-col gap-1">
            {task.subtasks.map((sub) => (
              <div key={sub.id} className="flex items-center gap-2">
                <StatusSelect
                  value={sub.status}
                  onChange={(status) =>
                    run(() => updateTaskStatus(sub.id, projectId, status))
                  }
                />
                <span className="flex-1 truncate text-sm">{sub.title}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <Input
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
              placeholder="Add subtask"
              className="h-8 text-sm"
            />
            <Button size="sm" variant="secondary" onClick={handleAddSubtask}>
              Add
            </Button>
          </div>
        </section>

        <section className="mb-6">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-subtle">
            Attachments
          </h3>
          <div className="flex flex-col gap-1">
            {task.attachments.map((att) => (
              <div key={att.id} className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => handleDownload(att.file_path)}
                  className="flex-1 truncate text-left text-accent hover:underline"
                >
                  {att.file_name}
                </button>
                <span className="text-xs text-foreground-subtle">
                  {formatFileSize(att.size)}
                </span>
                {att.uploaded_by === currentUserId && (
                  <button
                    onClick={() =>
                      run(() =>
                        deleteAttachment(att.id, att.file_path, projectId)
                      )
                    }
                    className="text-xs text-foreground-subtle hover:text-danger"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <form action={uploadAttachment} className="mt-2 flex items-center gap-2">
            <input type="hidden" name="taskId" value={task.id} />
            <input type="hidden" name="projectId" value={projectId} />
            <input
              type="file"
              name="file"
              className="flex-1 text-xs text-foreground-muted file:mr-2 file:rounded-md file:border file:border-border file:bg-surface file:px-2 file:py-1 file:text-xs"
            />
            <Button type="submit" size="sm" variant="secondary">
              Upload
            </Button>
          </form>
        </section>

        <section className="mb-6">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-subtle">
            Comments
          </h3>
          <div className="flex flex-col gap-3">
            {task.comments.map((comment) => {
              const author = profileById.get(comment.author_id);
              return (
                <div key={comment.id} className="flex gap-2">
                  <Avatar name={author?.full_name || author?.email || "?"} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{comment.body}</p>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-foreground-subtle">
                      <span>{author?.email}</span>
                      {comment.author_id === currentUserId && (
                        <button
                          onClick={() =>
                            run(() => deleteComment(comment.id, projectId))
                          }
                          className="hover:text-danger"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              placeholder="Write a comment"
              className="h-8 text-sm"
            />
            <Button size="sm" variant="secondary" onClick={handleAddComment}>
              Send
            </Button>
          </div>
        </section>

        <Button variant="danger" size="sm" onClick={handleDeleteTask} className="mt-auto">
          Delete task
        </Button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  addComment,
  addDependency,
  createTask,
  deleteAttachment,
  deleteComment,
  deleteTask,
  deleteTimeEntry,
  getAttachmentUrl,
  logTime,
  removeDependency,
  setCustomFieldValue,
  updateTaskDetails,
  updateTaskStatus,
  uploadAttachment,
} from "@/app/dashboard/actions";
import type { CustomField, Profile, Tag, Task, TaskStatus } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusSelect } from "@/components/tasks/status-select";
import { TagPicker } from "@/components/tasks/tag-picker";
import { useServerAction } from "@/lib/use-server-action";
import { formatFileSize } from "@/lib/utils";

export function TaskDetail({
  task,
  profiles,
  currentUserId,
  onClose,
  allTasks = [],
  tags = [],
  customFields = [],
  readOnly = false,
}: {
  task: Task;
  profiles: Profile[];
  currentUserId: string;
  onClose: () => void;
  allTasks?: Task[];
  tags?: Tag[];
  customFields?: CustomField[];
  readOnly?: boolean;
}) {
  const projectId = task.project_id;
  const { run } = useServerAction();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [assigneeId, setAssigneeId] = useState(task.assignee_id ?? "");
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [startDate, setStartDate] = useState(task.start_date ?? "");
  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");
  const [dependencyPick, setDependencyPick] = useState("");
  const [timeHours, setTimeHours] = useState("");
  const [timeNote, setTimeNote] = useState("");
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const taskById = new Map(allTasks.map((t) => [t.id, t]));

  const projectCustomFields = customFields.filter((f) => f.project_id === projectId);
  const dependencyOptions = allTasks.filter(
    (t) => t.id !== task.id && !task.dependsOnIds.includes(t.id)
  );
  const totalHours = task.timeEntries.reduce((sum, e) => sum + Number(e.hours), 0);

  function save(overrides: Partial<{ title: string; description: string; assigneeId: string | null; dueDate: string | null; startDate: string | null }> = {}) {
    run(() =>
      updateTaskDetails({
        taskId: task.id,
        projectId,
        title: overrides.title ?? title,
        description: overrides.description ?? description,
        assigneeId: "assigneeId" in overrides ? overrides.assigneeId! : assigneeId || null,
        dueDate: "dueDate" in overrides ? overrides.dueDate! : dueDate || null,
        startDate: "startDate" in overrides ? overrides.startDate : startDate || null,
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

  function handleAddDependency() {
    if (!dependencyPick) return;
    run(() => addDependency(task.id, dependencyPick, projectId));
    setDependencyPick("");
  }

  function handleLogTime() {
    const hours = parseFloat(timeHours);
    if (!(hours > 0)) return;
    run(() =>
      logTime({
        taskId: task.id,
        projectId,
        hours,
        note: timeNote,
        entryDate: new Date().toISOString().slice(0, 10),
      })
    );
    setTimeHours("");
    setTimeNote("");
  }

  return (
    <div className="fixed inset-0 z-10 flex justify-end bg-black/20" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-surface p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <StatusSelect
            value={task.status}
            onChange={readOnly ? () => {} : handleStatusChange}
          />
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
          onBlur={() => save()}
          readOnly={readOnly}
          className="mb-3 w-full text-lg font-medium outline-none"
        />

        {!readOnly && (
          <div className="mb-4">
            <TagPicker
              allTags={tags}
              selectedTagIds={task.tagIds}
              taskId={task.id}
              projectId={projectId}
            />
          </div>
        )}

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => save()}
          readOnly={readOnly}
          placeholder="Add a description..."
          rows={3}
          className="mb-4 w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-foreground-subtle focus:border-accent"
        />

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-foreground-subtle">Assignee</label>
            <select
              value={assigneeId}
              disabled={readOnly}
              onChange={(e) => {
                setAssigneeId(e.target.value);
                save({ assigneeId: e.target.value || null });
              }}
              className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-accent disabled:opacity-60"
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
              disabled={readOnly}
              onChange={(e) => setDueDate(e.target.value)}
              onBlur={() => save()}
              className="text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-foreground-subtle">Start date</label>
            <Input
              type="date"
              value={startDate}
              disabled={readOnly}
              onChange={(e) => setStartDate(e.target.value)}
              onBlur={() => save()}
              className="text-sm"
            />
          </div>
        </div>

        {projectCustomFields.length > 0 && (
          <section className="mb-6">
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-subtle">
              Fields
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {projectCustomFields.map((field) => (
                <div key={field.id}>
                  <label className="mb-1 block text-xs text-foreground-subtle">
                    {field.name}
                  </label>
                  {field.field_type === "dropdown" ? (
                    <select
                      defaultValue={task.customFieldValues[field.id] ?? ""}
                      disabled={readOnly}
                      onChange={(e) =>
                        run(() =>
                          setCustomFieldValue(task.id, field.id, e.target.value, projectId)
                        )
                      }
                      className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm outline-none focus:border-accent disabled:opacity-60"
                    >
                      <option value="">—</option>
                      {(field.options ?? []).map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      type={field.field_type === "number" ? "number" : field.field_type === "date" ? "date" : "text"}
                      defaultValue={task.customFieldValues[field.id] ?? ""}
                      disabled={readOnly}
                      onBlur={(e) =>
                        run(() =>
                          setCustomFieldValue(task.id, field.id, e.target.value, projectId)
                        )
                      }
                      className="text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {allTasks.length > 0 && (
          <section className="mb-6">
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-subtle">
              Blocked by
            </h3>
            <div className="flex flex-col gap-1">
              {task.dependsOnIds.map((depId) => {
                const dep = taskById.get(depId);
                if (!dep) return null;
                return (
                  <div key={depId} className="flex items-center gap-2">
                    <span
                      className={
                        dep.status === "done"
                          ? "flex-1 truncate text-sm text-foreground-subtle line-through"
                          : "flex-1 truncate text-sm"
                      }
                    >
                      {dep.title}
                    </span>
                    {!readOnly && (
                      <button
                        onClick={() => run(() => removeDependency(task.id, depId, projectId))}
                        className="text-xs text-foreground-subtle hover:text-danger"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {!readOnly && dependencyOptions.length > 0 && (
              <div className="mt-2 flex gap-2">
                <select
                  value={dependencyPick}
                  onChange={(e) => setDependencyPick(e.target.value)}
                  className="h-8 flex-1 rounded-md border border-border bg-surface px-2 text-sm outline-none focus:border-accent"
                >
                  <option value="">Select a task...</option>
                  {dependencyOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
                <Button size="sm" variant="secondary" onClick={handleAddDependency}>
                  Add
                </Button>
              </div>
            )}
          </section>
        )}

        <section className="mb-6">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-foreground-subtle">
            Subtasks
          </h3>
          <div className="flex flex-col gap-1">
            {task.subtasks.map((sub) => (
              <div key={sub.id} className="flex items-center gap-2">
                <StatusSelect
                  value={sub.status}
                  onChange={
                    readOnly ? () => {} : (status) => run(() => updateTaskStatus(sub.id, projectId, status))
                  }
                />
                <span className="flex-1 truncate text-sm">{sub.title}</span>
              </div>
            ))}
          </div>
          {!readOnly && (
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
          )}
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
                {!readOnly && att.uploaded_by === currentUserId && (
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
          {!readOnly && (
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
          )}
        </section>

        {!readOnly && (
          <section className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-wide text-foreground-subtle">
                Time logged
              </h3>
              {totalHours > 0 && (
                <span className="text-xs text-foreground-subtle">{totalHours}h total</span>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {task.timeEntries.map((entry) => {
                const author = profileById.get(entry.user_id);
                return (
                  <div key={entry.id} className="flex items-center gap-2 text-sm">
                    <span className="shrink-0 font-medium">{entry.hours}h</span>
                    <span className="flex-1 truncate text-foreground-muted">
                      {entry.note || "—"}
                    </span>
                    <span className="shrink-0 text-xs text-foreground-subtle">
                      {author?.full_name || author?.email}
                    </span>
                    {entry.user_id === currentUserId && (
                      <button
                        onClick={() => run(() => deleteTimeEntry(entry.id, projectId))}
                        className="text-xs text-foreground-subtle hover:text-danger"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex gap-2">
              <Input
                type="number"
                step="0.25"
                min="0"
                value={timeHours}
                onChange={(e) => setTimeHours(e.target.value)}
                placeholder="Hours"
                className="h-8 w-20 text-sm"
              />
              <Input
                value={timeNote}
                onChange={(e) => setTimeNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogTime()}
                placeholder="Note"
                className="h-8 flex-1 text-sm"
              />
              <Button size="sm" variant="secondary" onClick={handleLogTime}>
                Log
              </Button>
            </div>
          </section>
        )}

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

        {!readOnly && (
          <Button variant="danger" size="sm" onClick={handleDeleteTask} className="mt-auto">
            Delete task
          </Button>
        )}
      </div>
    </div>
  );
}

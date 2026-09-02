"use client";

import { updateTaskStatus } from "@/app/dashboard/actions";
import { TASK_STATUSES, type Profile, type Tag, type Task, type TaskStatus } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { TagChip } from "@/components/tasks/tag-picker";
import { useServerAction } from "@/lib/use-server-action";
import { cn, formatDate } from "@/lib/utils";
import { StatusSelect } from "@/components/tasks/status-select";

export function TaskList({
  tasks,
  profiles,
  tags,
  onSelect,
  readOnly = false,
}: {
  tasks: Task[];
  profiles: Profile[];
  tags?: Tag[];
  onSelect: (taskId: string) => void;
  readOnly?: boolean;
}) {
  const { run } = useServerAction();
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const tagById = new Map((tags ?? []).map((t) => [t.id, t]));

  function handleStatusChange(taskId: string, projectId: string, status: TaskStatus) {
    run(() => updateTaskStatus(taskId, projectId, status));
  }

  if (tasks.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-foreground-muted">
        No tasks match.
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      {tasks.map((task) => (
        <div key={task.id}>
          <TaskRow
            task={task}
            assignee={task.assignee_id ? profileById.get(task.assignee_id) : undefined}
            tagById={tagById}
            onSelect={onSelect}
            onStatusChange={handleStatusChange}
            readOnly={readOnly}
          />
          {task.subtasks.map((sub) => (
            <TaskRow
              key={sub.id}
              task={sub}
              assignee={sub.assignee_id ? profileById.get(sub.assignee_id) : undefined}
              tagById={tagById}
              onSelect={onSelect}
              onStatusChange={handleStatusChange}
              readOnly={readOnly}
              indent
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function TaskRow({
  task,
  assignee,
  tagById,
  onSelect,
  onStatusChange,
  readOnly,
  indent,
}: {
  task: Task;
  assignee?: Profile;
  tagById: Map<string, Tag>;
  onSelect: (taskId: string) => void;
  onStatusChange: (taskId: string, projectId: string, status: TaskStatus) => void;
  readOnly?: boolean;
  indent?: boolean;
}) {
  const dueDate = formatDate(task.due_date);
  const rowTags = task.tagIds.map((id) => tagById.get(id)).filter(Boolean) as Tag[];

  return (
    <button
      onClick={() => onSelect(task.id)}
      className={cn(
        "flex w-full items-center gap-3 border-b border-border py-2.5 text-left transition-colors hover:bg-surface-muted",
        indent && "pl-8"
      )}
    >
      <span
        className={cn(
          "truncate text-sm",
          task.status === "done" && "text-foreground-subtle line-through"
        )}
      >
        {task.title}
      </span>
      {rowTags.length > 0 && (
        <div className="flex shrink-0 gap-1">
          {rowTags.map((tag) => (
            <TagChip key={tag.id} tag={tag} />
          ))}
        </div>
      )}
      <span className="flex-1" />
      {dueDate && (
        <span className="shrink-0 text-xs text-foreground-subtle">{dueDate}</span>
      )}
      {readOnly ? (
        <span className="shrink-0 text-xs text-foreground-subtle">
          {TASK_STATUSES.find((s) => s.value === task.status)?.label}
        </span>
      ) : (
        <StatusSelect
          value={task.status}
          onChange={(status) => onStatusChange(task.id, task.project_id, status)}
        />
      )}
      <span className="w-8 shrink-0">
        {assignee && <Avatar name={assignee.full_name || assignee.email} />}
      </span>
    </button>
  );
}

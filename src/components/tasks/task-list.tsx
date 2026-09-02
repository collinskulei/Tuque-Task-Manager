"use client";

import { updateTaskStatus } from "@/app/dashboard/actions";
import type { Profile, Task, TaskStatus } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { useServerAction } from "@/lib/use-server-action";
import { cn, formatDate } from "@/lib/utils";
import { StatusSelect } from "@/components/tasks/status-select";

export function TaskList({
  tasks,
  profiles,
  onSelect,
}: {
  tasks: Task[];
  profiles: Profile[];
  onSelect: (taskId: string) => void;
}) {
  const { run } = useServerAction();
  const profileById = new Map(profiles.map((p) => [p.id, p]));

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
            onSelect={onSelect}
            onStatusChange={handleStatusChange}
          />
          {task.subtasks.map((sub) => (
            <TaskRow
              key={sub.id}
              task={sub}
              assignee={sub.assignee_id ? profileById.get(sub.assignee_id) : undefined}
              onSelect={onSelect}
              onStatusChange={handleStatusChange}
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
  onSelect,
  onStatusChange,
  indent,
}: {
  task: Task;
  assignee?: Profile;
  onSelect: (taskId: string) => void;
  onStatusChange: (taskId: string, projectId: string, status: TaskStatus) => void;
  indent?: boolean;
}) {
  const dueDate = formatDate(task.due_date);

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
          "flex-1 truncate text-sm",
          task.status === "done" && "text-foreground-subtle line-through"
        )}
      >
        {task.title}
      </span>
      {dueDate && (
        <span className="shrink-0 text-xs text-foreground-subtle">{dueDate}</span>
      )}
      <StatusSelect
        value={task.status}
        onChange={(status) => onStatusChange(task.id, task.project_id, status)}
      />
      <span className="w-8 shrink-0">
        {assignee && <Avatar name={assignee.full_name || assignee.email} />}
      </span>
    </button>
  );
}

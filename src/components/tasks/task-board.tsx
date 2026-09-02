"use client";

import { useState } from "react";
import { updateTaskStatus } from "@/app/dashboard/actions";
import { TASK_STATUSES, type Profile, type Task, type TaskStatus } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useServerAction } from "@/lib/use-server-action";
import { cn, formatDate } from "@/lib/utils";

export function TaskBoard({
  tasks,
  profiles,
  onSelect,
}: {
  tasks: Task[];
  profiles: Profile[];
  onSelect: (taskId: string) => void;
}) {
  const { run } = useServerAction();
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  function handleDrop(taskId: string, projectId: string, status: TaskStatus) {
    setDragOverColumn(null);
    run(() => updateTaskStatus(taskId, projectId, status));
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {TASK_STATUSES.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.value);
        return (
          <div
            key={column.value}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverColumn(column.value);
            }}
            onDragLeave={() => setDragOverColumn(null)}
            onDrop={(e) => {
              e.preventDefault();
              const { taskId, projectId } = JSON.parse(
                e.dataTransfer.getData("text/plain")
              );
              handleDrop(taskId, projectId, column.value);
            }}
            className={cn(
              "flex min-h-[200px] flex-col gap-2 rounded-lg border border-transparent p-2",
              dragOverColumn === column.value && "border-accent bg-accent-muted"
            )}
          >
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-medium text-foreground-muted">
                {column.label}
              </span>
              <span className="text-xs text-foreground-subtle">
                {columnTasks.length}
              </span>
            </div>

            {columnTasks.map((task) => {
              const assignee = task.assignee_id
                ? profileById.get(task.assignee_id)
                : undefined;
              const dueDate = formatDate(task.due_date);
              return (
                <Card
                  key={task.id}
                  draggable
                  onDragStart={(e) =>
                    e.dataTransfer.setData(
                      "text/plain",
                      JSON.stringify({ taskId: task.id, projectId: task.project_id })
                    )
                  }
                  onClick={() => onSelect(task.id)}
                  className="cursor-pointer p-3 hover:border-accent"
                >
                  <p className="text-sm">{task.title}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-foreground-subtle">
                      {dueDate ?? ""}
                    </span>
                    {assignee && <Avatar name={assignee.full_name || assignee.email} />}
                  </div>
                </Card>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

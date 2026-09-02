"use client";

import { TASK_STATUSES, type TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const dotColor: Record<TaskStatus, string> = {
  todo: "bg-foreground-subtle",
  in_progress: "bg-accent",
  done: "bg-green-600",
};

export function StatusSelect({
  value,
  onChange,
  className,
}: {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
  className?: string;
}) {
  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <span
        className={cn(
          "pointer-events-none absolute left-2 h-1.5 w-1.5 rounded-full",
          dotColor[value]
        )}
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as TaskStatus)}
        onClick={(e) => e.stopPropagation()}
        className="cursor-pointer appearance-none rounded-md border border-border bg-surface py-1 pr-2 pl-5 text-xs text-foreground-muted outline-none hover:bg-surface-muted"
      >
        {TASK_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}

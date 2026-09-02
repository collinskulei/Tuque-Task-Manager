"use client";

import { useMemo, useState } from "react";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildMonthGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

export function CalendarView({
  tasks,
  onSelect,
}: {
  tasks: Task[];
  onSelect: (taskId: string) => void;
}) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const allTasks = useMemo(() => tasks.flatMap((t) => [t, ...t.subtasks]), [tasks]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of allTasks) {
      if (!task.due_date) continue;
      const key = task.due_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    }
    return map;
  }, [allTasks]);

  const days = buildMonthGrid(cursor.getFullYear(), cursor.getMonth());
  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium">{monthLabel}</span>
        <div className="flex gap-1">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-muted"
          >
            Prev
          </button>
          <button
            onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-muted"
          >
            Today
          </button>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="rounded-md border border-border px-2 py-1 text-xs hover:bg-surface-muted"
          >
            Next
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-l border-border text-xs text-foreground-subtle">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="border-r border-t border-border px-2 py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7 border-l border-border">
        {days.map((day) => {
          const key = toDateKey(day);
          const dayTasks = tasksByDate.get(key) ?? [];
          const inMonth = day.getMonth() === cursor.getMonth();
          const isToday = key === toDateKey(today);

          return (
            <div
              key={key}
              className={cn(
                "min-h-[90px] border-b border-r border-border p-1 align-top",
                !inMonth && "bg-surface-muted/50"
              )}
            >
              <span
                className={cn(
                  "text-xs",
                  inMonth ? "text-foreground-muted" : "text-foreground-subtle",
                  isToday && "font-semibold text-accent"
                )}
              >
                {day.getDate()}
              </span>
              <div className="mt-1 flex flex-col gap-0.5">
                {dayTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onSelect(task.id)}
                    className={cn(
                      "truncate rounded bg-accent-muted px-1 py-0.5 text-left text-xs text-accent hover:opacity-80",
                      task.status === "done" && "line-through opacity-60"
                    )}
                  >
                    {task.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

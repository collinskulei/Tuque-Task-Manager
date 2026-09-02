"use client";

import { useMemo } from "react";
import type { Task, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const DAY_WIDTH = 32;

const barColor: Record<TaskStatus, string> = {
  todo: "bg-foreground-subtle",
  in_progress: "bg-accent",
  done: "bg-success",
};

function toDay(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00");
}

function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function TimelineView({
  tasks,
  onSelect,
}: {
  tasks: Task[];
  onSelect: (taskId: string) => void;
}) {
  const { rangeStart, days, rows } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dated = tasks.filter((t) => t.due_date || t.start_date);
    const starts = dated.map((t) => toDay(t.start_date ?? t.due_date!));
    const ends = dated.map((t) => toDay(t.due_date ?? t.start_date!));

    let minDate = starts.length ? new Date(Math.min(...starts.map((d) => d.getTime()))) : today;
    const maxDate = ends.length ? new Date(Math.max(...ends.map((d) => d.getTime()))) : today;

    minDate = new Date(Math.min(minDate.getTime(), today.getTime()));
    minDate.setDate(minDate.getDate() - 2);
    maxDate.setDate(maxDate.getDate() + 5);
    if (diffDays(minDate, maxDate) < 14) maxDate.setDate(minDate.getDate() + 14);

    const totalDays = diffDays(minDate, maxDate) + 1;
    const days = Array.from({ length: totalDays }, (_, i) => {
      const d = new Date(minDate);
      d.setDate(minDate.getDate() + i);
      return d;
    });

    const rows = tasks.map((task) => {
      if (!task.due_date && !task.start_date) return { task, offset: 0, span: 0, undated: true };
      const start = toDay(task.start_date ?? task.due_date!);
      const end = toDay(task.due_date ?? task.start_date!);
      const offset = diffDays(minDate, start);
      const span = Math.max(1, diffDays(start, end) + 1);
      return { task, offset, span, undated: false };
    });

    return { rangeStart: minDate, days, rows };
  }, [tasks]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOffset = diffDays(rangeStart, today);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <div style={{ width: days.length * DAY_WIDTH + 160, position: "relative" }}>
          <div className="sticky top-0 z-10 flex bg-surface">
            <div className="w-40 shrink-0 border-b border-border" />
            {days.map((day) => (
              <div
                key={day.toISOString()}
                style={{ width: DAY_WIDTH }}
                className="shrink-0 border-b border-l border-border py-1 text-center text-[10px] text-foreground-subtle"
              >
                {day.getDate() === 1 || day.getDay() === 1
                  ? day.toLocaleDateString(undefined, { month: "short", day: "numeric" })
                  : day.getDate()}
              </div>
            ))}
          </div>

          {rows.map(({ task, offset, span, undated }) => (
            <div key={task.id} className="flex items-center" style={{ height: 32 }}>
              <button
                onClick={() => onSelect(task.id)}
                className="w-40 shrink-0 truncate border-r border-border px-2 text-left text-xs hover:text-accent"
              >
                {task.title}
              </button>
              <div className="relative flex-1" style={{ height: 32 }}>
                {!undated && (
                  <button
                    onClick={() => onSelect(task.id)}
                    style={{
                      left: offset * DAY_WIDTH + 2,
                      width: span * DAY_WIDTH - 4,
                    }}
                    className={cn(
                      "absolute top-1.5 h-4 rounded",
                      barColor[task.status]
                    )}
                    title={task.title}
                  />
                )}
              </div>
            </div>
          ))}

          {todayOffset >= 0 && todayOffset < days.length && (
            <div
              className="pointer-events-none absolute top-0 bottom-0 w-px bg-danger"
              style={{ left: 160 + todayOffset * DAY_WIDTH }}
            />
          )}
        </div>
      </div>
      {tasks.length === 0 && (
        <p className="py-10 text-center text-sm text-foreground-muted">No tasks yet.</p>
      )}
    </div>
  );
}

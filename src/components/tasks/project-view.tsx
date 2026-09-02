"use client";

import { useMemo, useState } from "react";
import type { Profile, Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskList } from "@/components/tasks/task-list";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskDetail } from "@/components/tasks/task-detail";
import { createTask } from "@/app/dashboard/actions";
import { useServerAction } from "@/lib/use-server-action";
import { cn } from "@/lib/utils";

function matchesSearch(task: Task, query: string): boolean {
  if (task.title.toLowerCase().includes(query)) return true;
  return task.subtasks.some((sub) => sub.title.toLowerCase().includes(query));
}

export function ProjectView({
  projectId,
  tasks,
  profiles,
  currentUserId,
}: {
  projectId: string;
  tasks: Task[];
  profiles: Profile[];
  currentUserId: string;
}) {
  const [view, setView] = useState<"list" | "board">("list");
  const [search, setSearch] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const { run } = useServerAction();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tasks;
    return tasks.filter((t) => matchesSearch(t, query));
  }, [tasks, search]);

  const allTasks = useMemo(
    () => tasks.flatMap((t) => [t, ...t.subtasks]),
    [tasks]
  );
  const selectedTask = allTasks.find((t) => t.id === selectedTaskId) ?? null;

  function handleAddTask() {
    if (!newTaskTitle.trim()) return;
    run(() => createTask({ projectId, title: newTaskTitle }));
    setNewTaskTitle("");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex rounded-md border border-border p-0.5">
          {(["list", "board"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "rounded px-3 py-1 text-sm capitalize transition-colors",
                view === v
                  ? "bg-surface-muted text-foreground"
                  : "text-foreground-muted hover:text-foreground"
              )}
            >
              {v}
            </button>
          ))}
        </div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks"
          className="max-w-xs"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {view === "list" ? (
          <TaskList tasks={filtered} profiles={profiles} onSelect={setSelectedTaskId} />
        ) : (
          <TaskBoard tasks={filtered} profiles={profiles} onSelect={setSelectedTaskId} />
        )}
      </div>

      <div className="mt-3 flex gap-2 border-t border-border pt-3">
        <Input
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
          placeholder="+ Add task"
        />
        <Button onClick={handleAddTask}>Add</Button>
      </div>

      {selectedTask && (
        <TaskDetail
          key={selectedTask.id}
          task={selectedTask}
          profiles={profiles}
          currentUserId={currentUserId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
}

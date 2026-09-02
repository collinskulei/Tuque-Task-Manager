"use client";

import { useMemo, useState } from "react";
import type { Profile, Task } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { TaskList } from "@/components/tasks/task-list";
import { TaskDetail } from "@/components/tasks/task-detail";

export function MyTasksView({
  tasks,
  profiles,
  currentUserId,
}: {
  tasks: Task[];
  profiles: Profile[];
  currentUserId: string;
}) {
  const [search, setSearch] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tasks;
    return tasks.filter((t) => t.title.toLowerCase().includes(query));
  }, [tasks, search]);

  const selectedTask = tasks
    .flatMap((t) => [t, ...t.subtasks])
    .find((t) => t.id === selectedTaskId);

  return (
    <div className="flex h-full flex-col">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search my tasks"
        className="mb-4 max-w-xs"
      />

      <div className="flex-1 overflow-y-auto">
        {tasks.length === 0 ? (
          <p className="mt-16 text-center text-sm text-foreground-muted">
            No tasks yet. Assign yourself a task from a project.
          </p>
        ) : (
          <TaskList tasks={filtered} profiles={profiles} onSelect={setSelectedTaskId} />
        )}
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

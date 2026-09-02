"use client";

import { deleteProject } from "@/app/dashboard/actions";

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  return (
    <button
      onClick={() => {
        if (confirm("Delete this project and all its tasks?")) {
          deleteProject(projectId);
        }
      }}
      className="text-xs text-foreground-subtle hover:text-danger"
    >
      Delete project
    </button>
  );
}

"use client";

import { useState } from "react";
import { createProject } from "@/app/dashboard/actions";
import { Input } from "@/components/ui/input";

export function NewProjectForm() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-1 w-full rounded-md px-2 py-1.5 text-left text-sm text-foreground-subtle transition-colors hover:bg-surface-muted hover:text-foreground"
      >
        + New project
      </button>
    );
  }

  return (
    <form
      action={createProject}
      className="mt-1 px-2"
      onSubmit={() => setOpen(false)}
    >
      <Input
        name="name"
        placeholder="Project name"
        autoFocus
        onBlur={(e) => {
          if (!e.target.value) setOpen(false);
        }}
        className="h-8 text-sm"
      />
    </form>
  );
}

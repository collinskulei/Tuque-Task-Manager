"use client";

import { useState } from "react";
import Link from "next/link";
import { saveForm } from "@/app/dashboard/actions";
import type { CustomField, ProjectForm } from "@/lib/types";
import { useServerAction } from "@/lib/use-server-action";
import { Button } from "@/components/ui/button";

export function FormManager({
  projectId,
  form,
  customFields,
}: {
  projectId: string;
  form: ProjectForm | null;
  customFields: CustomField[];
}) {
  const { run } = useServerAction();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState(form?.description ?? "");
  const [includeDescription, setIncludeDescription] = useState(form?.include_description ?? true);
  const [includeDueDate, setIncludeDueDate] = useState(form?.include_due_date ?? true);
  const [includeAssignee, setIncludeAssignee] = useState(form?.include_assignee ?? false);
  const [customFieldIds, setCustomFieldIds] = useState<string[]>(form?.custom_field_ids ?? []);

  function handleSave() {
    run(() =>
      saveForm({
        projectId,
        description,
        includeDescription,
        includeDueDate,
        includeAssignee,
        customFieldIds,
      })
    );
  }

  function toggleField(id: string) {
    setCustomFieldIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-foreground-subtle hover:text-foreground"
      >
        Form
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-72 rounded-md border border-border bg-surface p-3 shadow-sm">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Intake form description (optional)"
            rows={2}
            className="mb-2 w-full resize-none rounded-md border border-border bg-surface px-2 py-1.5 text-xs outline-none placeholder:text-foreground-subtle"
          />

          <div className="flex flex-col gap-1 text-xs text-foreground-muted">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeDescription}
                onChange={(e) => setIncludeDescription(e.target.checked)}
              />
              Include description field
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeDueDate}
                onChange={(e) => setIncludeDueDate(e.target.checked)}
              />
              Include due date field
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeAssignee}
                onChange={(e) => setIncludeAssignee(e.target.checked)}
              />
              Include assignee field
            </label>
            {customFields.map((field) => (
              <label key={field.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={customFieldIds.includes(field.id)}
                  onChange={() => toggleField(field.id)}
                />
                Include &quot;{field.name}&quot; field
              </label>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-2">
            <Link
              href={`/dashboard/projects/${projectId}/intake`}
              className="text-xs text-accent hover:underline"
            >
              Open form
            </Link>
            <Button size="sm" variant="secondary" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
